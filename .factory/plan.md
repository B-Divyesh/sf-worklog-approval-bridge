# Worklog Bridge plan

## Product brief

Worklog Bridge helps freelance developers and small consultancies turn the Git
activity and calendar events they choose into a client-ready weekly worklog.
They can rewrite the technical detail, remove anything private, export the
worklog, and ask a client to approve the exact version they saw.

Promise: turn selected work activity into a reviewed worklog a client can
approve without installing surveillance software.

The three jobs are:

1. Select a week of local Git metadata and calendar events, then make a clear
   worklog from it.
2. Review, redact, export, and share the worklog without exposing repository
   content.
3. Keep a signed-in copy of an approved worklog and use a paid calendar import
   without giving up control of the local copy.

Worklog Bridge Pro costs **$12 per user each month** through Sociobot's Dodo
checkout. It adds calendar import and saved approval history. The free editor
and CSV export remain free. Background tracking, screenshots, keystroke
capture, direct calendar-account access, and repository upload are out of
scope.

## Evidence and wedge

The opportunity research is recorded in `.factory/brief.json`. The wedge is
local source selection and review: a freelancer can explain completed work to
a client without a tracker collecting the rest of their day.

## Architecture

- Front end: Vite and vanilla TypeScript, served by the service in production.
- Desktop: Tauri keeps selected Git collection on the device.
- API: Rust 2021, Axum, SQLx and SQLite in a multi-stage container. SQLite is
  suitable for this single product service and provides durable shared account
  data without a paid database service.
- Data: `users` are keyed by Entra `oid`; each `worklog` belongs to one user;
  `approval_receipts`, `licenses`, and rate-limit rows are separate. The
  client sends the complete active worklog only after the user chooses
  **Back up this worklog**.
- Auth: Sociobot Entra External ID, PKCE through `@azure/msal-browser` with
  session storage. The API reads discovery at startup and validates RS256 JWTs
  against cached JWKS, issuer, tenant, audience, expiry and not-before.
- Billing: Sociobot's pilot billing gateway and hosted Dodo checkout during
  this milestone. The client stores the return token locally; a signed-in
  check also records only a hashed token and verdict for that account.
- Operations: `/health` and `/api/health`, structured JSON logs, security
  headers, SQLite migrations with paired down migrations, and per-client rate
  limits. The IP key uses the first `X-Forwarded-For` hop and is hashed before
  it is persisted.
- Backup/export, user deletion, notifications, teams, and integrations are
  planned after M2.

## Design system

The night-market receipt rail in `.factory/design.md` remains the visual
contract. M2 account and backup controls use the existing cyan source,
amber-review, and mint-confirmation states; no separate account-dashboard
theme is introduced. A signed-in state is shown as a compact ticket in the
worklog's source column. All controls keep the 44px target, visible yellow
focus outline, plain language, and reduced-motion treatment.

## Milestones

### M1 — local worklog, demo, review and approval — complete

Delivered the desktop collector, isolated six-entry demo, editable review,
CSV export, local approval link, durable receipt service, free/Pro boundary,
download flow, legal pages, accessibility, and release preview. See
`.factory/handoff.md`, review records, and the existing claim registry.

### M2 — accounts, persistence, and subscription wiring — repair complete; deployment verification pending

Routes and screens:

- `/auth/callback` completes the Sociobot account redirect.
- `/app` adds a compact account ticket and explicit **Back up this worklog**
  / **Load saved worklog** actions.
- `/api/v1/worklogs/current` reads and writes an authenticated user's current
  worklog.
- `/api/v1/billing/verify` validates and records a signed-in billing verdict.
- `/health` and `/api/health` expose only service/build identity.

M2 claims add demo account isolation and test-mode billing wiring. API tests
cover JWT rejection, tenancy, migration, persistence, rate limiting, and
billing-verdict persistence with an isolated billing fixture. Browser claim
tests begin at `/demo` from a clean context and prove that sample work never
starts auth, account sync, or billing traffic.

Definition of done: migrations apply to a fresh SQLite database, every
non-health API path returns `429` and `Retry-After` once its per-client limit
is exceeded, CIAM is configured with PKCE and backend JWT validation, hosted
Sociobot checkout is wired, no demo data can reach a real account, and all M1 and
M2 tests/builds pass.

Implementation and repair verification completed on 2026-08-30. Repair 18
adds authenticated public-route coverage, exact M2 health checks, both API
families' rate-limit checks, and zero-config persistence coverage. The
production checkout currently redirects to hosted checkout. The final deployment gate is
the product-scoped Container App with its durable `/data` mount; exact evidence
is recorded in `.factory/handoff.md`.

### M3 — team and approval workflows — planned

Add shared client workspaces, a second reviewer role, receipt search, and
worklog templates. Keep individual source selection and redaction local.

### M4 — operations and data control — planned

Add support-safe admin tools, retention cleanup, managed backups,
transactional status email opt-in, and operational dashboards. Account
export/delete shipped early in M2 because persistence makes them necessary
data controls, not a later premium feature.

## Risks and experiments

| Risk | Experiment that retires it |
| --- | --- |
| The shared CIAM SPA redirect is not registered. | `az ad app show` was denied for the worker identity on 2026-08-30. An operator must register/confirm `https://worklog-approval-bridge.sociobot.in/auth/callback`, then complete a real sign-in. |
| The shared checkout can fail independently. | Keep checkout verification strict and product behavior fail-soft. Repair 18 observed a 303 hosted redirect after verification 19 recorded an environment-gated HTTP 500. |
| SQLite must survive revisions. | Deploy only `sf-worklog-approval-bridge`, mount its factory-managed durable share at `/data`, pin one replica, use one lockless-VFS connection with rollback journaling, and verify the generated secret is reused after restart. |
| Users do not want cloud copies of worklogs. | Make backup explicit, preserve local-first editing, and measure only opt-in support feedback (no product analytics). |
| SQLite reaches its single-service limit. | Keep all queries tenant-indexed and migrate to PostgreSQL before adding teams in M3 if operational load requires it. |
