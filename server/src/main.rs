use std::{
    collections::HashSet,
    env,
    net::SocketAddr,
    path::{Component, Path as FilePath, PathBuf},
    str::FromStr,
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use axum::{
    body::Body,
    extract::{Path, Query, Request, State},
    http::{header, HeaderMap, HeaderValue, Method, StatusCode, Uri},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{delete, get, post},
    Json, Router,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use jsonwebtoken::{decode, decode_header, jwk::JwkSet, Algorithm, DecodingKey, Validation};
use rand::RngCore;
use reqwest::{redirect::Policy, Client, Url};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions},
    FromRow, SqlitePool,
};
use tower::ServiceExt;
use tower_http::{services::ServeFile, trace::TraceLayer};
use tracing::{error, info, warn};
use uuid::Uuid;

const DEFAULT_TENANT_ID: &str = "35c6fe40-0ec0-46b6-98c6-213ad4de6650";
const DEFAULT_TENANT_SUBDOMAIN: &str = "sociobotcustomers";
const DEFAULT_CLIENT_ID: &str = "25c704f4-465a-47af-80ab-2c489466b697";
const PRODUCT: &str = "worklog-approval-bridge";

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone)]
struct Config {
    port: u16,
    database_url: String,
    static_dir: PathBuf,
    billing_base: String,
    tenant_id: String,
    client_id: String,
    discovery_url: String,
    build_sha: String,
}

impl Config {
    fn from_env() -> Self {
        let port = env::var("PORT")
            .ok()
            .and_then(|value| value.parse().ok())
            .unwrap_or(8080);
        let data_dir = env::var("APP_DATA_DIR").unwrap_or_else(|_| {
            let persistent = PathBuf::from("/data");
            if persistent.exists() {
                persistent.to_string_lossy().into_owned()
            } else {
                "data".to_owned()
            }
        });
        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| format!("sqlite://{data_dir}/worklog-bridge.sqlite3?mode=rwc"));
        let tenant_id =
            env::var("ENTRA_TENANT_ID").unwrap_or_else(|_| DEFAULT_TENANT_ID.to_owned());
        let tenant_subdomain = env::var("ENTRA_TENANT_SUBDOMAIN")
            .unwrap_or_else(|_| DEFAULT_TENANT_SUBDOMAIN.to_owned());
        let client_id =
            env::var("ENTRA_CLIENT_ID").unwrap_or_else(|_| DEFAULT_CLIENT_ID.to_owned());
        let default_discovery = format!(
            "https://{tenant_subdomain}.ciamlogin.com/{tenant_id}/v2.0/.well-known/openid-configuration"
        );
        Self {
            port,
            database_url,
            static_dir: PathBuf::from(
                env::var("STATIC_DIR").unwrap_or_else(|_| "dist/site".to_owned()),
            ),
            billing_base: env::var("BILLING_API_BASE")
                .unwrap_or_else(|_| "https://api.sociobot.in/api/v1".to_owned()),
            tenant_id,
            client_id,
            discovery_url: env::var("ENTRA_DISCOVERY_URL").unwrap_or(default_discovery),
            build_sha: env::var("BUILD_SHA")
                .or_else(|_| env::var("GIT_SHA"))
                .or_else(|_| env::var("SOURCE_COMMIT"))
                .unwrap_or_else(|_| "dev".to_owned()),
        }
    }
}

#[derive(Clone)]
struct AppState {
    pool: SqlitePool,
    auth: AuthService,
    config: Arc<Config>,
    http: Client,
    signing_secret: Arc<String>,
}

#[derive(Clone)]
struct AuthService {
    config: Arc<Config>,
    client: Client,
    cache: Arc<tokio::sync::RwLock<Option<OidcCache>>>,
}

#[derive(Clone)]
struct OidcCache {
    issuer: String,
    keys: JwkSet,
    fetched_at: SystemTime,
}

#[derive(Deserialize)]
struct OidcDiscovery {
    issuer: String,
    jwks_uri: String,
}

#[derive(Clone, Deserialize)]
struct Claims {
    oid: String,
    tid: String,
    iss: String,
    #[serde(default)]
    name: Option<String>,
    #[serde(default, alias = "preferred_username")]
    email: Option<String>,
}

#[derive(Clone)]
struct CurrentUser {
    oid: String,
    name: Option<String>,
    email: Option<String>,
}

impl AuthService {
    fn new(config: Arc<Config>, client: Client) -> Self {
        Self {
            config,
            client,
            cache: Arc::new(tokio::sync::RwLock::new(None)),
        }
    }

    async fn refresh(&self) -> Result<(), ApiError> {
        let discovery = self
            .client
            .get(&self.config.discovery_url)
            .send()
            .await
            .map_err(|_| ApiError::service("Sign-in setup is temporarily unavailable."))?
            .error_for_status()
            .map_err(|_| ApiError::service("Sign-in setup is temporarily unavailable."))?
            .json::<OidcDiscovery>()
            .await
            .map_err(|_| ApiError::service("Sign-in setup is temporarily unavailable."))?;
        let keys = self
            .client
            .get(&discovery.jwks_uri)
            .send()
            .await
            .map_err(|_| ApiError::service("Sign-in keys are temporarily unavailable."))?
            .error_for_status()
            .map_err(|_| ApiError::service("Sign-in keys are temporarily unavailable."))?
            .json::<JwkSet>()
            .await
            .map_err(|_| ApiError::service("Sign-in keys are temporarily unavailable."))?;
        *self.cache.write().await = Some(OidcCache {
            issuer: discovery.issuer,
            keys,
            fetched_at: SystemTime::now(),
        });
        Ok(())
    }

    async fn cache(&self) -> Result<OidcCache, ApiError> {
        let fresh = self.cache.read().await.clone().filter(|cache| {
            cache.fetched_at.elapsed().unwrap_or(Duration::MAX) < Duration::from_secs(3600)
        });
        if let Some(cache) = fresh {
            return Ok(cache);
        }
        self.refresh().await?;
        self.cache
            .read()
            .await
            .clone()
            .ok_or_else(|| ApiError::service("Sign-in setup is temporarily unavailable."))
    }

    async fn validate(&self, headers: &HeaderMap) -> Result<CurrentUser, ApiError> {
        let raw = headers
            .get(header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
            .ok_or_else(ApiError::unauthorized)?;
        let token_header = decode_header(raw).map_err(|_| ApiError::unauthorized())?;
        if token_header.alg != Algorithm::RS256 {
            return Err(ApiError::unauthorized());
        }
        let cache = self.cache().await?;
        let kid = token_header.kid.ok_or_else(ApiError::unauthorized)?;
        let jwk = cache.keys.find(&kid).ok_or_else(ApiError::unauthorized)?;
        let key = DecodingKey::from_jwk(jwk).map_err(|_| ApiError::unauthorized())?;
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_audience(&[self.config.client_id.as_str()]);
        validation.set_issuer(&[cache.issuer.as_str()]);
        validation.validate_nbf = true;
        let decoded =
            decode::<Claims>(raw, &key, &validation).map_err(|_| ApiError::unauthorized())?;
        let claims = decoded.claims;
        if claims.tid != self.config.tenant_id
            || claims.iss != cache.issuer
            || claims.oid.trim().is_empty()
        {
            return Err(ApiError::unauthorized());
        }
        Ok(CurrentUser {
            oid: claims.oid,
            name: claims.name,
            email: claims.email,
        })
    }
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    message: String,
    bearer: bool,
}

impl ApiError {
    fn bad_request(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.into(),
            bearer: false,
        }
    }
    fn unauthorized() -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            message: "Sign in to continue.".to_owned(),
            bearer: true,
        }
    }
    fn service(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::SERVICE_UNAVAILABLE,
            message: message.into(),
            bearer: false,
        }
    }
    fn internal() -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: "The service could not complete that request.".to_owned(),
            bearer: false,
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut response = (
            self.status,
            Json(serde_json::json!({ "error": self.message })),
        )
            .into_response();
        response
            .headers_mut()
            .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
        if self.bearer {
            response
                .headers_mut()
                .insert(header::WWW_AUTHENTICATE, HeaderValue::from_static("Bearer"));
        }
        response
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        error!(error = %error, "database request failed");
        Self::internal()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
    id: String,
    date: String,
    title: String,
    detail: String,
    source: String,
    duration: i64,
    ready: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorklogPayload {
    client: String,
    week: String,
    rate: f64,
    currency: String,
    entries: Vec<Entry>,
    sources: Vec<String>,
}

#[derive(FromRow)]
struct WorklogRow {
    payload_json: String,
    updated_at: String,
}

#[derive(Serialize)]
struct WorklogResponse {
    worklog: Option<WorklogPayload>,
    updated_at: Option<String>,
}

#[derive(Deserialize)]
struct LicenseInput {
    license: String,
}

#[derive(Deserialize)]
struct CheckoutQuery {
    email: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CheckoutResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    checkout_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Deserialize, Serialize)]
struct BillingVerdict {
    valid: bool,
    #[serde(default)]
    reason: String,
    #[serde(default)]
    expires_at: Option<String>,
}

#[derive(Deserialize)]
struct ApprovalInput {
    #[serde(rename = "packetDigest")]
    packet_digest: String,
    approver: String,
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
struct ApprovalReceipt {
    version: i64,
    #[sqlx(rename = "receipt_id")]
    receipt_id: String,
    #[sqlx(rename = "packet_digest")]
    packet_digest: String,
    approver: String,
    #[sqlx(rename = "accepted_at")]
    accepted_at: String,
    attestation: String,
}

#[derive(Serialize)]
struct ApprovalLookup {
    receipt: ApprovalReceipt,
    valid: bool,
}

#[derive(Serialize)]
struct BuildIdentity {
    service: &'static str,
    version: &'static str,
    commit: String,
}

#[derive(Serialize)]
struct Health {
    status: &'static str,
    build: BuildIdentity,
}

fn now_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
fn hash_text(value: &str) -> String {
    hex::encode(Sha256::digest(value.as_bytes()))
}

fn public_build(state: &AppState) -> Health {
    Health {
        status: "ok",
        build: BuildIdentity {
            service: "worklog-approval-bridge",
            version: env!("CARGO_PKG_VERSION"),
            commit: state.config.build_sha.clone(),
        },
    }
}

fn first_forwarded_ip(headers: &HeaderMap) -> &str {
    headers
        .get("x-forwarded-for")
        .or_else(|| headers.get("x-azure-clientip"))
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("unknown")
}

async fn rate_limit(State(state): State<AppState>, request: Request, next: Next) -> Response {
    let path = request.uri().path();
    if path == "/health" || path == "/api/health" {
        return next.run(request).await;
    }
    let sensitive = matches!(
        *request.method(),
        Method::POST | Method::PUT | Method::PATCH | Method::DELETE
    ) || path.contains("/billing/");
    let (scope, limit, window) = if sensitive {
        ("write", 12_i64, 60_i64)
    } else {
        ("read", 40_i64, 1_i64)
    };
    let timestamp = now_seconds();
    let bucket = timestamp / window;
    let key = hash_text(first_forwarded_ip(request.headers()));
    let result = sqlx::query_scalar::<_, i64>(
        "INSERT INTO rate_limits (client_key, scope, window_start, count, updated_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP) \
         ON CONFLICT(client_key, scope) DO UPDATE SET \
           count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END, \
           window_start = excluded.window_start, updated_at = CURRENT_TIMESTAMP \
         RETURNING count"
    ).bind(key).bind(scope).bind(bucket).fetch_one(&state.pool).await;
    match result {
        Ok(count) if count > limit => {
            let retry_after = (window - timestamp.rem_euclid(window)).max(1).to_string();
            let mut response = (
                StatusCode::TOO_MANY_REQUESTS,
                Json(serde_json::json!({ "error": "Too many requests. Try again shortly." })),
            )
                .into_response();
            response.headers_mut().insert(
                header::RETRY_AFTER,
                HeaderValue::from_str(&retry_after).unwrap_or(HeaderValue::from_static("1")),
            );
            response
                .headers_mut()
                .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
            response
        }
        Ok(_) => next.run(request).await,
        Err(error) => {
            error!(error = %error, "rate limit storage failed");
            ApiError::service("The service is busy. Try again shortly.").into_response()
        }
    }
}

async fn security_headers(request: Request, next: Next) -> Response {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        "referrer-policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        "permissions-policy",
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert(
        header::STRICT_TRANSPORT_SECURITY,
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    );
    headers.insert("content-security-policy", HeaderValue::from_static("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://sociobotcustomers.ciamlogin.com https://api.sociobot.in https://api.github.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://api.sociobot.in; frame-ancestors 'none'"));
    response
}

async fn health(State(state): State<AppState>) -> Json<Health> {
    Json(public_build(&state))
}

async fn upsert_user(pool: &SqlitePool, user: &CurrentUser) -> Result<(), ApiError> {
    sqlx::query("INSERT INTO users (oid, display_name, email) VALUES (?, ?, ?) ON CONFLICT(oid) DO UPDATE SET display_name = excluded.display_name, email = excluded.email, updated_at = CURRENT_TIMESTAMP")
        .bind(&user.oid).bind(&user.name).bind(&user.email).execute(pool).await?;
    Ok(())
}

fn validate_worklog(worklog: &WorklogPayload) -> Result<(), ApiError> {
    if worklog.client.trim().len() > 160 {
        return Err(ApiError::bad_request(
            "Client name must be 160 characters or fewer.",
        ));
    }
    if !worklog.week.chars().all(|c| c.is_ascii_digit() || c == '-') || worklog.week.len() != 10 {
        return Err(ApiError::bad_request("Choose a valid work week."));
    }
    if !worklog.rate.is_finite() || !(0.0..=1_000_000.0).contains(&worklog.rate) {
        return Err(ApiError::bad_request("Choose a valid hourly rate."));
    }
    if worklog.currency.len() != 3 || !worklog.currency.chars().all(|c| c.is_ascii_uppercase()) {
        return Err(ApiError::bad_request(
            "Choose a three-letter currency code.",
        ));
    }
    if worklog.entries.len() > 1_000 || worklog.sources.len() > 100 {
        return Err(ApiError::bad_request(
            "This worklog is too large to back up.",
        ));
    }
    for entry in &worklog.entries {
        if entry.id.is_empty()
            || entry.id.len() > 100
            || entry.title.trim().is_empty()
            || entry.title.len() > 100
            || entry.detail.len() > 280
            || !(1..=1_440).contains(&entry.duration)
        {
            return Err(ApiError::bad_request(
                "Each work entry needs a short summary and one to 1,440 minutes.",
            ));
        }
    }
    Ok(())
}

async fn get_current_worklog(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<WorklogResponse>, ApiError> {
    let user = state.auth.validate(&headers).await?;
    let row = sqlx::query_as::<_, WorklogRow>(
        "SELECT payload_json, updated_at FROM worklogs WHERE owner_oid = ? LIMIT 1",
    )
    .bind(&user.oid)
    .fetch_optional(&state.pool)
    .await?;
    match row {
        Some(row) => {
            let worklog =
                serde_json::from_str(&row.payload_json).map_err(|_| ApiError::internal())?;
            Ok(Json(WorklogResponse {
                worklog: Some(worklog),
                updated_at: Some(row.updated_at),
            }))
        }
        None => Ok(Json(WorklogResponse {
            worklog: None,
            updated_at: None,
        })),
    }
}

async fn put_current_worklog(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(worklog): Json<WorklogPayload>,
) -> Result<Json<WorklogResponse>, ApiError> {
    let user = state.auth.validate(&headers).await?;
    validate_worklog(&worklog)?;
    upsert_user(&state.pool, &user).await?;
    let payload_json = serde_json::to_string(&worklog).map_err(|_| ApiError::internal())?;
    sqlx::query("INSERT INTO worklogs (id, owner_oid, client, week, rate, currency, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(owner_oid) DO UPDATE SET client = excluded.client, week = excluded.week, rate = excluded.rate, currency = excluded.currency, payload_json = excluded.payload_json, updated_at = CURRENT_TIMESTAMP")
        .bind(Uuid::new_v4().to_string()).bind(&user.oid).bind(&worklog.client).bind(&worklog.week).bind(worklog.rate).bind(&worklog.currency).bind(&payload_json).execute(&state.pool).await?;
    let updated_at =
        sqlx::query_scalar::<_, String>("SELECT updated_at FROM worklogs WHERE owner_oid = ?")
            .bind(&user.oid)
            .fetch_one(&state.pool)
            .await?;
    Ok(Json(WorklogResponse {
        worklog: Some(worklog),
        updated_at: Some(updated_at),
    }))
}

async fn export_account(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let user = state.auth.validate(&headers).await?;
    let row = sqlx::query_as::<_, WorklogRow>(
        "SELECT payload_json, updated_at FROM worklogs WHERE owner_oid = ? LIMIT 1",
    )
    .bind(&user.oid)
    .fetch_optional(&state.pool)
    .await?;
    let worklog = match row {
        Some(row) => Some(
            serde_json::from_str::<WorklogPayload>(&row.payload_json)
                .map_err(|_| ApiError::internal())?,
        ),
        None => None,
    };
    let mut response = Json(WorklogResponse {
        worklog,
        updated_at: None,
    })
    .into_response();
    response.headers_mut().insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_static("attachment; filename=worklog-bridge-account-export.json"),
    );
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    Ok(response)
}

async fn delete_account(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<StatusCode, ApiError> {
    let user = state.auth.validate(&headers).await?;
    sqlx::query("DELETE FROM users WHERE oid = ?")
        .bind(user.oid)
        .execute(&state.pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn verify_billing(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<LicenseInput>,
) -> Result<Json<BillingVerdict>, ApiError> {
    let user = state.auth.validate(&headers).await?;
    let token = input.license.trim();
    if token.is_empty() || token.len() > 4096 {
        return Err(ApiError::bad_request("Paste a valid license token."));
    }
    let endpoint = format!(
        "{}/products/{PRODUCT}/verify",
        state.config.billing_base.trim_end_matches('/')
    );
    let response = state
        .http
        .get(endpoint)
        .query(&[("license", token)])
        .send()
        .await
        .map_err(|_| {
            ApiError::service("The billing service could not be reached. Try again online.")
        })?;
    if !response.status().is_success() {
        return Err(ApiError::service(
            "The billing service could not verify this license. Try again online.",
        ));
    }
    let verdict = response.json::<BillingVerdict>().await.map_err(|_| {
        ApiError::service("The billing service returned an invalid license result.")
    })?;
    upsert_user(&state.pool, &user).await?;
    sqlx::query("INSERT INTO licenses (owner_oid, license_hash, valid, reason, expires_at, checked_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(owner_oid) DO UPDATE SET license_hash = excluded.license_hash, valid = excluded.valid, reason = excluded.reason, expires_at = excluded.expires_at, checked_at = CURRENT_TIMESTAMP")
        .bind(&user.oid).bind(hash_text(token)).bind(verdict.valid).bind(&verdict.reason).bind(&verdict.expires_at).execute(&state.pool).await?;
    Ok(Json(verdict))
}

async fn checkout(
    State(state): State<AppState>,
    Query(query): Query<CheckoutQuery>,
) -> Json<CheckoutResponse> {
    let endpoint = format!(
        "{}/products/{PRODUCT}/checkout",
        state.config.billing_base.trim_end_matches('/')
    );
    let mut request = state.http.get(endpoint);
    if let Some(email) = query
        .email
        .as_deref()
        .map(str::trim)
        .filter(|email| email.len() <= 254 && email.contains('@'))
    {
        request = request.query(&[("email", email)]);
    }
    let response = match request.send().await {
        Ok(response) => response,
        Err(_) => {
            return Json(CheckoutResponse {
                checkout_url: None,
                error: Some(
                    "Checkout could not be reached. Keep using the free editor and try again."
                        .to_string(),
                ),
            });
        }
    };
    if response.status() != StatusCode::SEE_OTHER {
        return Json(CheckoutResponse {
            checkout_url: None,
            error: Some(
                "Checkout is unavailable right now. Keep using the free editor and try again."
                    .to_string(),
            ),
        });
    }
    let location = response
        .headers()
        .get(header::LOCATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| Url::parse(value).ok())
        .filter(|url| {
            url.scheme() == "https" && url.host_str() == Some("checkout.dodopayments.com")
        })
        .map(|url| url.to_string());
    match location {
        Some(checkout_url) => Json(CheckoutResponse {
            checkout_url: Some(checkout_url),
            error: None,
        }),
        None => Json(CheckoutResponse {
            checkout_url: None,
            error: Some("Checkout returned an unsafe address. Try again later.".to_string()),
        }),
    }
}

fn validate_approval(input: &ApprovalInput) -> Result<(String, String), ApiError> {
    let digest = input.packet_digest.trim().to_lowercase();
    let approver = input
        .approver
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");
    if digest.len() != 64 || !digest.chars().all(|char| char.is_ascii_hexdigit()) {
        return Err(ApiError::bad_request(
            "A valid worklog identifier is required.",
        ));
    }
    if approver.is_empty() || approver.len() > 160 {
        return Err(ApiError::bad_request(
            "Enter a name of up to 160 characters.",
        ));
    }
    Ok((digest, approver))
}

fn sign_receipt(receipt: &ApprovalReceipt, secret: &str) -> String {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC accepts any key length");
    mac.update(
        format!(
            "{}|{}|{}|{}|{}",
            receipt.version,
            receipt.receipt_id,
            receipt.packet_digest,
            receipt.approver,
            receipt.accepted_at
        )
        .as_bytes(),
    );
    URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes())
}

fn valid_receipt(receipt: &ApprovalReceipt, secret: &str) -> bool {
    sign_receipt(receipt, secret) == receipt.attestation
}

async fn find_approval(
    state: &AppState,
    uri: &Uri,
    receipt_id: Option<&str>,
) -> Result<Response, ApiError> {
    let query = uri.query().unwrap_or_default();
    let digest = query
        .split('&')
        .find_map(|part| {
            part.split_once('=')
                .filter(|(key, _)| *key == "packetDigest")
                .map(|(_, value)| value)
        })
        .and_then(|value| percent_decode(value).ok())
        .unwrap_or_default()
        .to_lowercase();
    if digest.len() != 64 || !digest.chars().all(|char| char.is_ascii_hexdigit()) {
        return Err(ApiError::bad_request(
            "A valid worklog identifier is required.",
        ));
    }
    let receipt = sqlx::query_as::<_, ApprovalReceipt>("SELECT 2 AS version, receipt_id, packet_digest, approver, accepted_at, attestation FROM approval_receipts WHERE packet_digest = ?")
        .bind(&digest).fetch_optional(&state.pool).await?;
    match receipt {
        Some(receipt) if receipt_id.is_some_and(|id| id != receipt.receipt_id) => Err(ApiError {
            status: StatusCode::NOT_FOUND,
            message: "Receipt not found.".to_owned(),
            bearer: false,
        }),
        Some(receipt) => Ok(Json(ApprovalLookup {
            valid: valid_receipt(&receipt, &state.signing_secret),
            receipt,
        })
        .into_response()),
        None if receipt_id.is_some() => Err(ApiError {
            status: StatusCode::NOT_FOUND,
            message: "Receipt not found.".to_owned(),
            bearer: false,
        }),
        None => Ok(StatusCode::NO_CONTENT.into_response()),
    }
}

async fn get_approval(State(state): State<AppState>, uri: Uri) -> Result<Response, ApiError> {
    find_approval(&state, &uri, None).await
}

async fn get_approval_by_id(
    State(state): State<AppState>,
    uri: Uri,
    Path(receipt_id): Path<String>,
) -> Result<Response, ApiError> {
    find_approval(&state, &uri, Some(&receipt_id)).await
}

async fn post_approval(
    State(state): State<AppState>,
    Json(input): Json<ApprovalInput>,
) -> Result<Response, ApiError> {
    let (packet_digest, approver) = validate_approval(&input)?;
    let accepted_at = chrono::Utc::now().to_rfc3339();
    let mut receipt = ApprovalReceipt {
        version: 2,
        receipt_id: Uuid::new_v4().to_string(),
        packet_digest: packet_digest.clone(),
        approver,
        accepted_at,
        attestation: String::new(),
    };
    receipt.attestation = sign_receipt(&receipt, &state.signing_secret);
    let inserted = sqlx::query("INSERT INTO approval_receipts (packet_digest, receipt_id, approver, accepted_at, attestation) VALUES (?, ?, ?, ?, ?) ON CONFLICT(packet_digest) DO NOTHING")
        .bind(&receipt.packet_digest).bind(&receipt.receipt_id).bind(&receipt.approver).bind(&receipt.accepted_at).bind(&receipt.attestation).execute(&state.pool).await?.rows_affected() == 1;
    if inserted {
        return Ok((
            StatusCode::CREATED,
            Json(serde_json::json!({ "receipt": receipt, "created": true })),
        )
            .into_response());
    }
    let existing = sqlx::query_as::<_, ApprovalReceipt>("SELECT 2 AS version, receipt_id, packet_digest, approver, accepted_at, attestation FROM approval_receipts WHERE packet_digest = ?")
        .bind(packet_digest).fetch_one(&state.pool).await?;
    Ok((
        StatusCode::CONFLICT,
        Json(serde_json::json!({ "receipt": existing, "created": false })),
    )
        .into_response())
}

fn percent_decode(value: &str) -> Result<String, ()> {
    let mut bytes = Vec::with_capacity(value.len());
    let chars = value.as_bytes();
    let mut index = 0;
    while index < chars.len() {
        if chars[index] == b'%' && index + 2 < chars.len() {
            let high = (chars[index + 1] as char).to_digit(16).ok_or(())?;
            let low = (chars[index + 2] as char).to_digit(16).ok_or(())?;
            bytes.push((high * 16 + low) as u8);
            index += 3;
        } else {
            bytes.push(chars[index]);
            index += 1;
        }
    }
    String::from_utf8(bytes).map_err(|_| ())
}

async fn spa(State(state): State<AppState>) -> Response {
    serve_named(&state.config.static_dir, "index.html").await
}
async fn asset(State(state): State<AppState>, Path(path): Path<String>) -> Response {
    if !safe_relative(&path) {
        return not_found(State(state)).await;
    }
    // Axum's catch-all extractor removes the matched `/assets/` route prefix.
    // Keep that directory when resolving Vite's root-relative hashed URLs.
    let mut response = serve_named(&state.config.static_dir, &format!("assets/{path}")).await;
    if response.status().is_success() {
        response.headers_mut().insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=31536000, immutable"),
        );
    }
    response
}
async fn root_file(State(state): State<AppState>, uri: Uri) -> Response {
    let name = uri.path().trim_start_matches('/');
    if safe_relative(name) {
        serve_named(&state.config.static_dir, name).await
    } else {
        not_found(State(state)).await
    }
}
async fn not_found(State(state): State<AppState>) -> Response {
    let mut response = serve_named(&state.config.static_dir, "404.html").await;
    *response.status_mut() = StatusCode::NOT_FOUND;
    response
}

fn safe_relative(path: &str) -> bool {
    !path.is_empty()
        && FilePath::new(path)
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
}

async fn serve_named(static_dir: &FilePath, name: &str) -> Response {
    let path = static_dir.join(name);
    match ServeFile::new(path)
        .oneshot(Request::new(Body::empty()))
        .await
    {
        Ok(response) if response.status() != StatusCode::NOT_FOUND => response.into_response(),
        _ => (StatusCode::NOT_FOUND, "Not found").into_response(),
    }
}

async fn database(config: &Config) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let database_path = config
        .database_url
        .strip_prefix("sqlite://")
        .and_then(|value| value.split('?').next())
        .map(PathBuf::from);
    if let Some(path) = database_path.as_deref().and_then(FilePath::parent) {
        tokio::fs::create_dir_all(path).await?;
    }
    if let Some(path) = database_path.as_deref() {
        if matches!(tokio::fs::metadata(path).await, Ok(metadata) if metadata.len() == 0) {
            let journal = PathBuf::from(format!("{}-journal", path.display()));
            let _ = tokio::fs::remove_file(&journal).await;
            tokio::fs::remove_file(path).await?;
            warn!(database = %path.display(), "removed an incomplete empty SQLite bootstrap");
        }
    }
    let mut options = SqliteConnectOptions::from_str(&config.database_url)?
        .foreign_keys(true)
        .journal_mode(SqliteJournalMode::Delete)
        .busy_timeout(Duration::from_secs(30));
    if !config.database_url.contains(":memory:") {
        // Azure Files does not provide SQLite-compatible POSIX byte-range
        // locking. The deployment is pinned to one replica and this process
        // uses one connection, so SQLite's lockless Unix VFS is safe here.
        options = options.vfs("unix-none");
    }
    let pool = SqlitePoolOptions::new()
        // Azure Files is the durable volume in production. One connection
        // avoids competing SQLite locks inside a single-replica service.
        .max_connections(1)
        .connect_with(options)
        .await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}

async fn signing_secret(pool: &SqlitePool) -> Result<(String, bool), sqlx::Error> {
    if let Some(existing) = sqlx::query_scalar::<_, String>(
        "SELECT value FROM settings WHERE key = 'receipt-signing-secret'",
    )
    .fetch_optional(pool)
    .await?
    {
        return Ok((existing, false));
    }
    let mut bytes = [0_u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    let value = URL_SAFE_NO_PAD.encode(bytes);
    let inserted = sqlx::query("INSERT INTO settings (key, value) VALUES ('receipt-signing-secret', ?) ON CONFLICT(key) DO NOTHING").bind(&value).execute(pool).await?.rows_affected() == 1;
    if inserted {
        Ok((value, true))
    } else {
        Ok((
            sqlx::query_scalar::<_, String>(
                "SELECT value FROM settings WHERE key = 'receipt-signing-secret'",
            )
            .fetch_one(pool)
            .await?,
            false,
        ))
    }
}

fn app(state: AppState) -> Router {
    let standard_files: HashSet<&'static str> = [
        "robots.txt",
        "sitemap.xml",
        "service-worker.js",
        "manifest.webmanifest",
        "favicon.svg",
        "install.sh",
        "install.ps1",
    ]
    .into_iter()
    .collect();
    Router::new()
        .route("/health", get(health))
        .route("/api/health", get(health))
        .route(
            "/api/v1/worklogs/current",
            get(get_current_worklog).put(put_current_worklog),
        )
        .route("/api/v1/account/export", get(export_account))
        .route("/api/v1/account", delete(delete_account))
        .route("/api/v1/billing/checkout", get(checkout))
        .route("/api/v1/billing/verify", post(verify_billing))
        .route("/api/approvals", get(get_approval).post(post_approval))
        .route("/api/approvals/{receipt_id}", get(get_approval_by_id))
        .route("/", get(spa))
        .route("/demo", get(spa))
        .route("/app", get(spa))
        .route("/auth/callback", get(spa))
        .route("/privacy", get(spa))
        .route("/terms", get(spa))
        .route("/download", get(spa))
        .route("/checkout", get(spa))
        .route("/approve", get(spa))
        .route("/assets/{*path}", get(asset))
        .route(
            "/{file}",
            get(move |state: State<AppState>, uri: Uri| async move {
                if standard_files.contains(uri.path().trim_start_matches('/')) {
                    root_file(state, uri).await
                } else {
                    not_found(state).await
                }
            }),
        )
        .fallback(get(not_found))
        .layer(middleware::from_fn(security_headers))
        .layer(middleware::from_fn_with_state(state.clone(), rate_limit))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env().add_directive("info".parse()?),
        )
        .json()
        .init();
    let config = Arc::new(Config::from_env());
    let supplied = [
        "ENTRA_TENANT_ID",
        "ENTRA_TENANT_SUBDOMAIN",
        "ENTRA_CLIENT_ID",
        "DATABASE_URL",
        "BILLING_API_BASE",
    ]
    .into_iter()
    .filter(|key| env::var(key).is_ok())
    .collect::<Vec<_>>();
    let pool = database(&config).await?;
    let (secret, generated) = signing_secret(&pool).await?;
    info!(generated_receipt_signing_secret = generated, supplied_config = ?supplied, database = %config.database_url, "Worklog Bridge configuration ready; secret values are never logged");
    let http = Client::builder()
        .timeout(Duration::from_secs(10))
        .redirect(Policy::none())
        .user_agent("worklog-approval-bridge/0.2")
        .build()?;
    let auth = AuthService::new(config.clone(), http.clone());
    match auth.refresh().await {
        Ok(()) => info!("Sociobot CIAM discovery and JWKS loaded"),
        Err(error) => {
            warn!(message = %error.message, "CIAM discovery was unavailable at startup; it will retry when a user signs in")
        }
    };
    let state = AppState {
        pool,
        auth,
        config: config.clone(),
        http,
        signing_secret: Arc::new(secret),
    };
    let listener =
        tokio::net::TcpListener::bind(SocketAddr::from(([0, 0, 0, 0], config.port))).await?;
    info!(port = config.port, "Worklog Bridge server listening");
    axum::serve(listener, app(state))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::Request;
    use http_body_util::BodyExt;
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde_json::{json, Value};
    use tempfile::TempDir;

    const TEST_ISSUER: &str = "https://issuer.example.test/tenant/v2.0";
    const TEST_PRIVATE_KEY: &str = r#"-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDI5r+SpitPS2Cd
H8PX0NHEVZN9M3mf6vRUrocLNtR8OhAyHQR7ELs1etANgw/0G/zwoJh8Qo9q2VHz
Yfxgp+iBYB9ZnUy3OikLIuI+MBkytHPntE1kvfssucAD8AQXg56OwUGio25lwqXF
06mPGL5UFvviwt3j0voIM61u+GnRyGpAooXj1qOMZsl39a9q4kTZ9HKsMwaMtlil
RACV6RF951l2LVRHRCkzakk6kOrlXQ5fIQI0LUsCMVWePmcZi+kDffxeKFPce+2q
15ntVaru4qqe/4aMdorKDZGg3uTsOEBmjnSlF6lJpA7j6KujL2UP2y5IFJ6O8MvH
CgnQBp4hAgMBAAECggEAPf/ABUDUws7PTQ4dgT/HTKDgOFYnZau7pVqLAHH2VzQQ
BXchB92c+J8jD9hvlvUANT5KcKaV3fKdMM//c9C9lxeT9TLvFuiS/AXS7kAntpcr
4cipzbo3hpD4af6rNJqA1yta1xc6nZrZT9jHTgrjyc2iBFQA6CsW0GsqTcHJ3lw/
pOlZsWWI5IQ9QMsokqbCF1MgxMOso1sW+djyjPiK/4hISOlDJHmzEBlpLBWYruu6
jbgSQx4HbI6oHtDI1oobT1tWcIN6VmkLMYVOITlDg6qv3wxrblLH3UTUpFDGwF5+
lugJLKWefaX74TAqAgVqGCioWFVU/FY/x8ocdIRplQKBgQD4oPKUTQ99DvBn8Ans
c4TrekUK0Sel/jS9X7O+Bk+AeP6HG36rX+PqLTE5vpi2egL4Md9wqHM10+2EQnGa
yNGNIwJtqzVLJMg3QMkhtwUfLIm6QwDHNPdoas6ugBOcwP5VHRo/OPpD0LnPrUom
DExSoO/ZEU99+WR8GGUtX0BHswKBgQDO247MZ3X/saKpAgyHCPEeAjF/1JvYkCFA
rpwj9LUl1WoiUo/TPy8KDgbRq8FC1G4a3flBgmg+lscYCFy+p1g59hf4UOEZoSqp
Owb30cUzo0h6KoANKfop7ZJTx2aaPSixT16qF2mrWf/Ikkw0+8NDEbY6VE3muv+8
BKQftS2Y2wKBgQDervjVzvdSYTD9Rsb8mrKwXcC84XwLdlUyUCciyXAndzcxN3UK
dUYjFfsC5yzMMxe5yKGBu74Eth4D2ab6pWbabELeivuepAEXS9VZdx0FQNTSmPR3
d38obJFVRa1LNqgU/43kllnAp4/k7CZ/UYCCeVaZKqHyCI7xfsAQFUHzdQKBgD8D
axChQ7TMa/yH/0DzXGAD0whZv8/MuBR4HGBnnvcTd+1UsTNsv+uUMkeUxp6RD6ln
jRKDozXNwIB1q6r4V0vwx4SBPtEL428B6DF92VDNoLp2T+Oysd4r3LNgvsSldMvu
nau6zhnApMZ4qnZJa0X3E0fZfpGWzWh9EXIHQwiZAoGANBaxW0E0KyxygHBRyKEJ
+a3kTO2PD0NnSsHPuVLBnboSKvDPH0A3bk875QHabC/9N5iu1kVliKpSGU4H1oSb
uJzySjmjr9zJItq0qgkAInvJJFMQdiviHRt3pP/avuzFscPImcOfTZr8dYdInVt+
9wkos/UMPTWC/lS3xewZvcU=
-----END PRIVATE KEY-----"#;

    #[derive(Serialize)]
    struct TestTokenClaims {
        aud: String,
        exp: i64,
        nbf: i64,
        oid: String,
        tid: String,
        iss: String,
        name: String,
        email: String,
    }

    async fn test_pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    async fn test_state() -> AppState {
        let pool = test_pool().await;
        let config = Arc::new(Config {
            port: 0,
            database_url: "sqlite::memory:".to_owned(),
            static_dir: PathBuf::from("../dist/site"),
            billing_base: "http://127.0.0.1:9/api/v1".to_owned(),
            tenant_id: DEFAULT_TENANT_ID.to_owned(),
            client_id: DEFAULT_CLIENT_ID.to_owned(),
            discovery_url: "http://127.0.0.1:9/discovery".to_owned(),
            build_sha: "test-build".to_owned(),
        });
        let http = Client::builder()
            .timeout(Duration::from_millis(100))
            .redirect(Policy::none())
            .build()
            .unwrap();
        AppState {
            pool,
            auth: AuthService::new(config.clone(), http.clone()),
            config,
            http,
            signing_secret: Arc::new("test-secret".to_owned()),
        }
    }

    async fn authenticated_test_state() -> AppState {
        let state = test_state().await;
        let keys = serde_json::from_value(json!({
            "keys": [{
                "kty": "RSA",
                "n": "yOa_kqYrT0tgnR_D19DRxFWTfTN5n-r0VK6HCzbUfDoQMh0EexC7NXrQDYMP9Bv88KCYfEKPatlR82H8YKfogWAfWZ1MtzopCyLiPjAZMrRz57RNZL37LLnAA_AEF4OejsFBoqNuZcKlxdOpjxi-VBb74sLd49L6CDOtbvhp0chqQKKF49ajjGbJd_WvauJE2fRyrDMGjLZYpUQAlekRfedZdi1UR0QpM2pJOpDq5V0OXyECNC1LAjFVnj5nGYvpA338XihT3HvtqteZ7VWq7uKqnv-GjHaKyg2RoN7k7DhAZo50pRepSaQO4-iroy9lD9suSBSejvDLxwoJ0AaeIQ",
                "e": "AQAB",
                "kid": "test-key",
                "use": "sig",
                "alg": "RS256"
            }]
        }))
        .unwrap();
        *state.auth.cache.write().await = Some(OidcCache {
            issuer: TEST_ISSUER.to_owned(),
            keys,
            fetched_at: SystemTime::now(),
        });
        state
    }

    fn bearer_token_with(
        oid: &str,
        name: &str,
        audience: &str,
        tenant: &str,
        issuer: &str,
        expires: i64,
        not_before: i64,
    ) -> String {
        let mut header = Header::new(Algorithm::RS256);
        header.kid = Some("test-key".to_owned());
        encode(
            &header,
            &TestTokenClaims {
                aud: audience.to_owned(),
                exp: expires,
                nbf: not_before,
                oid: oid.to_owned(),
                tid: tenant.to_owned(),
                iss: issuer.to_owned(),
                name: name.to_owned(),
                email: format!("{}@example.test", name.to_lowercase()),
            },
            &EncodingKey::from_rsa_pem(TEST_PRIVATE_KEY.as_bytes()).unwrap(),
        )
        .unwrap()
    }

    fn bearer_token(oid: &str, name: &str) -> String {
        bearer_token_with(
            oid,
            name,
            DEFAULT_CLIENT_ID,
            DEFAULT_TENANT_ID,
            TEST_ISSUER,
            now_seconds() + 3_600,
            now_seconds() - 60,
        )
    }

    fn authenticated_request(method: Method, path: &str, token: &str, body: Body) -> Request<Body> {
        Request::builder()
            .method(method)
            .uri(path)
            .header(header::AUTHORIZATION, format!("Bearer {token}"))
            .header(header::CONTENT_TYPE, "application/json")
            .body(body)
            .unwrap()
    }

    async fn response_json(response: Response) -> Value {
        serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes()).unwrap()
    }

    async fn test_state_with_static_dir(static_dir: PathBuf) -> AppState {
        let mut state = test_state().await;
        Arc::make_mut(&mut state.config).static_dir = static_dir;
        state.auth.config = state.config.clone();
        state
    }

    async fn billing_fixture(status: StatusCode, location: Option<&'static str>) -> String {
        let fixture = Router::new().route(
            "/api/v1/products/worklog-approval-bridge/checkout",
            get(move || async move {
                let mut response = status.into_response();
                if let Some(location) = location {
                    response
                        .headers_mut()
                        .insert(header::LOCATION, HeaderValue::from_static(location));
                }
                response
            }),
        );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        tokio::spawn(async move { axum::serve(listener, fixture).await.unwrap() });
        format!("http://{address}/api/v1")
    }

    async fn license_fixture() -> String {
        let fixture = Router::new().route(
            "/api/v1/products/worklog-approval-bridge/verify",
            get(
                |Query(query): Query<std::collections::HashMap<String, String>>| async move {
                    if query.get("license").map(String::as_str) != Some("known-private-license") {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(json!({"error": "unexpected license"})),
                        );
                    }
                    (
                        StatusCode::OK,
                        Json(json!({
                            "valid": true,
                            "reason": "ok",
                            "expires_at": "2026-12-31T23:59:59Z"
                        })),
                    )
                },
            ),
        );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        tokio::spawn(async move { axum::serve(listener, fixture).await.unwrap() });
        format!("http://{address}/api/v1")
    }

    fn sample_worklog(client: &str) -> WorklogPayload {
        WorklogPayload {
            client: client.to_owned(),
            week: "2026-08-24".to_owned(),
            rate: 135.0,
            currency: "USD".to_owned(),
            sources: vec!["repo · Git".to_owned()],
            entries: vec![Entry {
                id: "entry-1".to_owned(),
                date: "2026-08-25".to_owned(),
                title: "Fixed a filter".to_owned(),
                detail: "Checked the result state.".to_owned(),
                source: "Git".to_owned(),
                duration: 60,
                ready: true,
            }],
        }
    }

    #[tokio::test]
    async fn claim_m2_account_persistence_uses_authenticated_http_routes() {
        let state = authenticated_test_state().await;
        let pool = state.pool.clone();
        let router = app(state);
        let alice_token = bearer_token("alice-oid", "Alice");
        let bob_token = bearer_token("bob-oid", "Bob");

        for (token, worklog) in [
            (&alice_token, sample_worklog("Alice client")),
            (&bob_token, sample_worklog("Bob client")),
        ] {
            let response = router
                .clone()
                .oneshot(authenticated_request(
                    Method::PUT,
                    "/api/v1/worklogs/current",
                    token,
                    Body::from(serde_json::to_vec(&worklog).unwrap()),
                ))
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::OK);
        }

        for (owner, license_hash) in [
            ("alice-oid", hash_text("alice-license")),
            ("bob-oid", hash_text("bob-license")),
        ] {
            sqlx::query("INSERT INTO licenses (owner_oid, license_hash, valid, reason) VALUES (?, ?, 1, 'ok')")
                .bind(owner)
                .bind(license_hash)
                .execute(&pool)
                .await
                .unwrap();
        }

        let alice = router
            .clone()
            .oneshot(authenticated_request(
                Method::GET,
                "/api/v1/worklogs/current",
                &alice_token,
                Body::empty(),
            ))
            .await
            .unwrap();
        assert_eq!(alice.status(), StatusCode::OK);
        let alice = response_json(alice).await;
        assert_eq!(alice["worklog"]["client"], "Alice client");
        assert_ne!(alice["worklog"]["client"], "Bob client");

        let exported = router
            .clone()
            .oneshot(authenticated_request(
                Method::GET,
                "/api/v1/account/export",
                &alice_token,
                Body::empty(),
            ))
            .await
            .unwrap();
        assert_eq!(exported.status(), StatusCode::OK);
        assert_eq!(
            exported.headers().get(header::CONTENT_DISPOSITION).unwrap(),
            "attachment; filename=worklog-bridge-account-export.json"
        );
        assert_eq!(
            response_json(exported).await["worklog"]["client"],
            "Alice client"
        );

        let deleted = router
            .clone()
            .oneshot(authenticated_request(
                Method::DELETE,
                "/api/v1/account",
                &alice_token,
                Body::empty(),
            ))
            .await
            .unwrap();
        assert_eq!(deleted.status(), StatusCode::NO_CONTENT);

        let alice_after_delete = router
            .clone()
            .oneshot(authenticated_request(
                Method::GET,
                "/api/v1/worklogs/current",
                &alice_token,
                Body::empty(),
            ))
            .await
            .unwrap();
        assert!(response_json(alice_after_delete).await["worklog"].is_null());

        let alice_license_count =
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM licenses WHERE owner_oid = ?")
                .bind("alice-oid")
                .fetch_one(&pool)
                .await
                .unwrap();
        let bob_license_count =
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM licenses WHERE owner_oid = ?")
                .bind("bob-oid")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(
            alice_license_count, 0,
            "account deletion must remove that account's license result"
        );
        assert_eq!(
            bob_license_count, 1,
            "account deletion must not change another account's license result"
        );

        let bob = router
            .oneshot(authenticated_request(
                Method::GET,
                "/api/v1/worklogs/current",
                &bob_token,
                Body::empty(),
            ))
            .await
            .unwrap();
        assert_eq!(response_json(bob).await["worklog"]["client"], "Bob client");
    }

    #[tokio::test]
    async fn claim_m2_license_token_storage_is_one_way() {
        let mut state = authenticated_test_state().await;
        Arc::make_mut(&mut state.config).billing_base = license_fixture().await;
        state.auth.config = state.config.clone();
        let pool = state.pool.clone();
        let router = app(state);
        let token = bearer_token("alice-oid", "Alice");
        let raw_license = "known-private-license";

        let response = router
            .oneshot(authenticated_request(
                Method::POST,
                "/api/v1/billing/verify",
                &token,
                Body::from(json!({"license": raw_license}).to_string()),
            ))
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(response_json(response).await["valid"], true);

        let (stored_hash, valid, reason) = sqlx::query_as::<_, (String, i64, String)>(
            "SELECT license_hash, valid, reason FROM licenses WHERE owner_oid = ?",
        )
        .bind("alice-oid")
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(stored_hash, hash_text(raw_license));
        assert_ne!(stored_hash, raw_license);
        assert_eq!(valid, 1);
        assert_eq!(reason, "ok");

        let stored_row = sqlx::query_scalar::<_, String>(
            "SELECT owner_oid || '|' || license_hash || '|' || reason FROM licenses WHERE owner_oid = ?",
        )
        .bind("alice-oid")
        .fetch_one(&pool)
        .await
        .unwrap();
        assert!(
            !stored_row.contains(raw_license),
            "the raw license token must not be stored"
        );
    }

    #[tokio::test]
    async fn claim_m2_auth_boundary_validates_every_protected_route_and_token_claim() {
        let router = app(authenticated_test_state().await);
        for (method, path, body) in [
            (Method::GET, "/api/v1/worklogs/current", Body::empty()),
            (Method::GET, "/api/v1/account/export", Body::empty()),
            (Method::DELETE, "/api/v1/account", Body::empty()),
            (
                Method::POST,
                "/api/v1/billing/verify",
                Body::from(r#"{"license":"test"}"#),
            ),
        ] {
            let response = router
                .clone()
                .oneshot(
                    Request::builder()
                        .method(method)
                        .uri(path)
                        .header(header::CONTENT_TYPE, "application/json")
                        .body(body)
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::UNAUTHORIZED, "{path}");
            assert_eq!(
                response.headers().get(header::WWW_AUTHENTICATE).unwrap(),
                "Bearer",
                "{path}"
            );
        }

        let now = now_seconds();
        for (case, token) in [
            (
                "audience",
                bearer_token_with(
                    "alice-oid",
                    "Alice",
                    "wrong-audience",
                    DEFAULT_TENANT_ID,
                    TEST_ISSUER,
                    now + 3_600,
                    now - 60,
                ),
            ),
            (
                "tenant",
                bearer_token_with(
                    "alice-oid",
                    "Alice",
                    DEFAULT_CLIENT_ID,
                    "wrong-tenant",
                    TEST_ISSUER,
                    now + 3_600,
                    now - 60,
                ),
            ),
            (
                "issuer",
                bearer_token_with(
                    "alice-oid",
                    "Alice",
                    DEFAULT_CLIENT_ID,
                    DEFAULT_TENANT_ID,
                    "https://wrong-issuer.example.test/",
                    now + 3_600,
                    now - 60,
                ),
            ),
            (
                "expiry",
                bearer_token_with(
                    "alice-oid",
                    "Alice",
                    DEFAULT_CLIENT_ID,
                    DEFAULT_TENANT_ID,
                    TEST_ISSUER,
                    now - 3_600,
                    now - 7_200,
                ),
            ),
            (
                "not-before",
                bearer_token_with(
                    "alice-oid",
                    "Alice",
                    DEFAULT_CLIENT_ID,
                    DEFAULT_TENANT_ID,
                    TEST_ISSUER,
                    now + 7_200,
                    now + 7_200,
                ),
            ),
            ("account-id", bearer_token("", "Alice")),
        ] {
            let response = router
                .clone()
                .oneshot(authenticated_request(
                    Method::GET,
                    "/api/v1/worklogs/current",
                    &token,
                    Body::empty(),
                ))
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::UNAUTHORIZED, "{case}");
            assert_eq!(
                response.headers().get(header::WWW_AUTHENTICATE).unwrap(),
                "Bearer"
            );
        }
    }

    #[tokio::test]
    async fn claim_m2_rate_limit_covers_account_and_approval_api_families() {
        let router = app(test_state().await);
        for (path, client, body) in [
            ("/api/v1/account", "203.0.113.8, 10.0.0.1", ""),
            ("/api/approvals", "198.51.100.9, 10.0.0.1", "{}"),
        ] {
            let mut response = None;
            for _ in 0..13 {
                response = Some(
                    router
                        .clone()
                        .oneshot(
                            Request::builder()
                                .method(if path == "/api/v1/account" {
                                    Method::DELETE
                                } else {
                                    Method::POST
                                })
                                .uri(path)
                                .header("x-forwarded-for", client)
                                .header(header::CONTENT_TYPE, "application/json")
                                .body(Body::from(body))
                                .unwrap(),
                        )
                        .await
                        .unwrap(),
                );
            }
            let response = response.unwrap();
            assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS, "{path}");
            let retry_after = response
                .headers()
                .get(header::RETRY_AFTER)
                .unwrap()
                .to_str()
                .unwrap()
                .parse::<u64>()
                .unwrap();
            assert!((1..=60).contains(&retry_after), "{path}");
        }
    }

    #[tokio::test]
    async fn claim_m2_rate_limit_storage_hashes_client_addresses() {
        let state = test_state().await;
        let pool = state.pool.clone();
        let router = app(state);
        let client_address = "203.0.113.77";
        let response = router
            .oneshot(
                Request::builder()
                    .uri("/app")
                    .header("x-forwarded-for", format!("{client_address}, 10.0.0.1"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_ne!(response.status(), StatusCode::TOO_MANY_REQUESTS);

        let stored_key = sqlx::query_scalar::<_, String>(
            "SELECT client_key FROM rate_limits WHERE scope = 'read'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(stored_key, hash_text(client_address));
        assert_ne!(stored_key, client_address);
        assert!(
            !stored_key.contains(client_address),
            "the client address must not be stored in plaintext"
        );
    }

    #[tokio::test]
    async fn receipt_secret_is_generated_once_and_survives_restart() {
        let pool = test_pool().await;
        let (first, generated) = signing_secret(&pool).await.unwrap();
        let (second, generated_again) = signing_secret(&pool).await.unwrap();
        assert!(generated);
        assert!(!generated_again);
        assert_eq!(first, second);
    }

    #[tokio::test]
    async fn regression_durable_sqlite_uses_lockless_vfs_and_serializes_connections() {
        let directory = TempDir::new().unwrap();
        let database_path = directory.path().join("durable.sqlite3");
        tokio::fs::write(&database_path, []).await.unwrap();
        tokio::fs::write(
            directory.path().join("durable.sqlite3-journal"),
            b"interrupted bootstrap",
        )
        .await
        .unwrap();
        let mut config = Config::from_env();
        config.database_url = format!(
            "sqlite://{}/durable.sqlite3?mode=rwc",
            directory.path().display()
        );
        let pool = database(&config).await.unwrap();

        let journal = sqlx::query_scalar::<_, String>("PRAGMA journal_mode")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(journal.to_ascii_lowercase(), "delete");
        assert!(tokio::fs::metadata(&database_path).await.unwrap().len() > 0);
        assert!(
            tokio::fs::metadata(directory.path().join("durable.sqlite3-journal"))
                .await
                .is_err()
        );

        let held = pool.acquire().await.unwrap();
        assert!(
            tokio::time::timeout(Duration::from_millis(50), pool.acquire())
                .await
                .is_err()
        );
        drop(held);
        assert!(tokio::time::timeout(Duration::from_secs(1), pool.acquire())
            .await
            .is_ok());
    }

    #[tokio::test]
    async fn claim_m2_public_health_fields_identify_both_routes_without_configuration() {
        let router = app(test_state().await);
        for path in ["/health", "/api/health"] {
            let response = router
                .clone()
                .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::OK, "{path}");
            assert_eq!(
                response
                    .headers()
                    .get(header::STRICT_TRANSPORT_SECURITY)
                    .unwrap(),
                "max-age=31536000; includeSubDomains",
                "{path}"
            );
            let body = response_json(response).await;
            assert_eq!(
                body,
                json!({
                    "status": "ok",
                    "build": {
                        "service": "worklog-approval-bridge",
                        "version": env!("CARGO_PKG_VERSION"),
                        "commit": "test-build"
                    }
                }),
                "{path}"
            );
            let serialized = body.to_string();
            assert!(!serialized.contains("database"));
            assert!(!serialized.contains("billing"));
            assert!(!serialized.contains("secret"));
        }
    }

    #[tokio::test]
    async fn regression_checkout_fails_soft_on_upstream_500_and_accepts_only_hosted_redirect() {
        let mut failure_state = test_state().await;
        Arc::make_mut(&mut failure_state.config).billing_base =
            billing_fixture(StatusCode::INTERNAL_SERVER_ERROR, None).await;
        let failure = app(failure_state)
            .oneshot(
                Request::builder()
                    .uri("/api/v1/billing/checkout")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(failure.status(), StatusCode::OK);
        let body = response_json(failure).await;
        assert!(body["checkoutUrl"].is_null());
        assert_eq!(
            body["error"],
            "Checkout is unavailable right now. Keep using the free editor and try again."
        );

        let mut success_state = test_state().await;
        Arc::make_mut(&mut success_state.config).billing_base = billing_fixture(
            StatusCode::SEE_OTHER,
            Some("https://checkout.dodopayments.com/session/regression"),
        )
        .await;
        let success = app(success_state)
            .oneshot(
                Request::builder()
                    .uri("/api/v1/billing/checkout?email=person%40example.test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(success.status(), StatusCode::OK);
        assert_eq!(
            response_json(success).await["checkoutUrl"],
            "https://checkout.dodopayments.com/session/regression"
        );
    }

    #[tokio::test]
    async fn regression_hashed_frontend_assets_keep_directory_mime_and_bytes() {
        let static_root = TempDir::new().unwrap();
        tokio::fs::create_dir(static_root.path().join("assets"))
            .await
            .unwrap();
        tokio::fs::write(
            static_root.path().join("index.html"),
            "<!doctype html><main><h1>Worklog Bridge</h1></main>",
        )
        .await
        .unwrap();
        tokio::fs::write(
            static_root.path().join("assets/index-AB12cd34.css"),
            "body{color:#fff}",
        )
        .await
        .unwrap();
        tokio::fs::write(
            static_root.path().join("assets/index-EF56gh78.js"),
            "document.documentElement.dataset.ready='true';",
        )
        .await
        .unwrap();
        let router = app(test_state_with_static_dir(static_root.path().to_path_buf()).await);

        for (path, expected_type, expected_body) in [
            ("/assets/index-AB12cd34.css", "text/css", "body{color:#fff}"),
            (
                "/assets/index-EF56gh78.js",
                "javascript",
                "document.documentElement.dataset.ready='true';",
            ),
        ] {
            let response = router
                .clone()
                .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
                .await
                .unwrap();
            assert_eq!(
                response.status(),
                StatusCode::OK,
                "{path} must resolve below dist/site/assets"
            );
            assert!(response
                .headers()
                .get(header::CONTENT_TYPE)
                .unwrap()
                .to_str()
                .unwrap()
                .contains(expected_type));
            assert_eq!(
                response.headers().get(header::CACHE_CONTROL).unwrap(),
                "public, max-age=31536000, immutable"
            );
            let body = response.into_body().collect().await.unwrap().to_bytes();
            assert_eq!(body, expected_body);
        }

        let spa = router
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/privacy")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(
            spa.status(),
            StatusCode::OK,
            "the known-route SPA fallback must remain available"
        );
        assert!(spa
            .headers()
            .get(header::CONTENT_TYPE)
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("text/html"));

        let health = router
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(
            health.status(),
            StatusCode::OK,
            "the container health route must remain available"
        );
        assert!(health
            .headers()
            .get(header::CONTENT_TYPE)
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("application/json"));
    }

    #[tokio::test]
    async fn regression_unaccepted_approval_lookup_is_a_successful_empty_response() {
        let router = app(test_state().await);
        let digest = "a".repeat(64);
        let response = router
            .clone()
            .oneshot(
                Request::builder()
                    .uri(format!("/api/approvals?packetDigest={}", "a".repeat(64)))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NO_CONTENT);

        let created = router
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/approvals")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(format!(
                        r#"{{"packetDigest":"{digest}","approver":"Repair verifier"}}"#
                    )))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(created.status(), StatusCode::CREATED);
        let body = created.into_body().collect().await.unwrap().to_bytes();
        let payload: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(payload["receipt"]["packetDigest"], digest);
        assert!(payload["receipt"]["receiptId"].is_string());
        assert!(payload["receipt"]["acceptedAt"].is_string());
        assert!(payload["receipt"].get("packet_digest").is_none());

        let lookup = router
            .oneshot(
                Request::builder()
                    .uri(format!("/api/approvals?packetDigest={digest}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(lookup.status(), StatusCode::OK);
        let body = lookup.into_body().collect().await.unwrap().to_bytes();
        let payload: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(payload["receipt"]["packetDigest"], digest);
        assert_eq!(payload["valid"], true);
    }
}
