export type AccountSession = {
  name: string;
  email: string;
  idToken: string;
};

type StoredAccount = Pick<AccountSession, "name" | "email">;

const CLIENT_ID = "25c704f4-465a-47af-80ab-2c489466b697";
const TENANT_ID = "35c6fe40-0ec0-46b6-98c6-213ad4de6650";
const AUTHORITY = `https://sociobotcustomers.ciamlogin.com/${TENANT_ID}/`;
const SNAPSHOT_KEY = "worklog-bridge:account";
const SCOPES = ["openid", "profile", "email"];

let current: AccountSession | null = null;
let clientPromise: Promise<import("@azure/msal-browser").PublicClientApplication> | null = null;

function callbackUrl() {
  return `${location.origin}/auth/callback`;
}

async function client() {
  if (!clientPromise) {
    clientPromise = import("@azure/msal-browser").then(async ({ PublicClientApplication }) => {
      const instance = new PublicClientApplication({
        auth: {
          clientId: CLIENT_ID,
          authority: AUTHORITY,
          redirectUri: callbackUrl()
        },
        cache: { cacheLocation: "sessionStorage" }
      });
      await instance.initialize();
      return instance;
    });
  }
  return clientPromise;
}

function remember(session: AccountSession | null) {
  current = session;
  if (session) sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ name: session.name, email: session.email } satisfies StoredAccount));
  else sessionStorage.removeItem(SNAPSHOT_KEY);
}

function sessionFromResult(result: { account: { name?: string; username?: string } | null; idToken?: string }) {
  if (!result.account || !result.idToken) return null;
  return {
    name: result.account.name || result.account.username || "Signed-in account",
    email: result.account.username || "",
    idToken: result.idToken
  } satisfies AccountSession;
}

export function accountSnapshot(): StoredAccount | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || "null") as StoredAccount | null;
    return saved && typeof saved.name === "string" && typeof saved.email === "string" ? saved : null;
  } catch { return null; }
}

export function currentAccount() {
  return current;
}

export async function restoreAccount(): Promise<AccountSession | null> {
  const needsMsal = location.pathname === "/auth/callback" || Boolean(accountSnapshot());
  if (!needsMsal) return null;
  const instance = await client();
  const redirectResult = await instance.handleRedirectPromise();
  if (redirectResult) {
    const session = sessionFromResult(redirectResult);
    remember(session);
    return session;
  }
  const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
  if (!account) { remember(null); return null; }
  instance.setActiveAccount(account);
  try {
    const result = await instance.acquireTokenSilent({ account, scopes: SCOPES });
    const session = sessionFromResult(result);
    remember(session);
    return session;
  } catch {
    // A redirect is only started after the user chooses Sign in again.
    remember(null);
    return null;
  }
}

export async function startSignIn() {
  const instance = await client();
  await instance.loginRedirect({ scopes: SCOPES, redirectUri: callbackUrl() });
}

export async function startSignOut() {
  const instance = await client();
  const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
  remember(null);
  await instance.logoutRedirect({ account, postLogoutRedirectUri: `${location.origin}/app` });
}
