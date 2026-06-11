/**
 * SmartUser API adapter.
 *
 * All HTTP paths below are env-configurable defaults that MUST be verified
 * against the real SmartUser API documentation before going to production.
 */

export interface SmartUserResult {
  userId: string;
  email: string;
  token?: string;
  expiresAt?: string;
}

interface SmartUserConfig {
  baseUrl: string;
  appId: string;
  appSecret: string;
  env: string;
  loginPath: string;
  signupPath: string;
  sessionPath: string;
  logoutPath: string;
}

function getConfig(): SmartUserConfig {
  const baseUrl = Deno.env.get("SMARTUSER_API_BASE_URL");
  const appId = Deno.env.get("SMARTUSER_APP_ID");
  const appSecret = Deno.env.get("SMARTUSER_APP_SECRET");

  if (!baseUrl) {
    throw new Error(
      "Missing required env var: SMARTUSER_API_BASE_URL"
    );
  }
  if (!appId) {
    throw new Error("Missing required env var: SMARTUSER_APP_ID");
  }
  if (!appSecret) {
    throw new Error(
      "Missing required env var: SMARTUSER_APP_SECRET"
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    appId,
    appSecret,
    env: Deno.env.get("SMARTUSER_ENV") ?? "STAG",
    // Paths are defaults — update to match real SmartUser API docs.
    loginPath: Deno.env.get("SMARTUSER_LOGIN_PATH") ?? "/auth/login",
    signupPath: Deno.env.get("SMARTUSER_SIGNUP_PATH") ?? "/auth/signup",
    sessionPath: Deno.env.get("SMARTUSER_SESSION_PATH") ?? "/auth/session",
    logoutPath: Deno.env.get("SMARTUSER_LOGOUT_PATH") ?? "/auth/logout",
  };
}

function authHeaders(cfg: SmartUserConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-App-Id": cfg.appId,
    "X-App-Secret": cfg.appSecret,
    "X-Environment": cfg.env,
  };
}

function extractUserId(data: Record<string, unknown>): string {
  const id =
    data.userId ?? data.user_id ?? data.id ?? data.obfuscatedReference;
  if (!id) {
    throw new Error("SmartUser API did not return a user identifier");
  }
  return String(id);
}

function extractEmail(
  data: Record<string, unknown>,
  submittedEmail: string
): string {
  // Prefer canonical email from the API response; fall back only if absent.
  if (typeof data.email === "string" && data.email.length > 0) {
    return data.email;
  }
  return submittedEmail;
}

function extractToken(data: Record<string, unknown>): string | undefined {
  const t = data.token ?? data.sessionToken ?? data.access_token;
  return typeof t === "string" ? t : undefined;
}

function extractExpiresAt(data: Record<string, unknown>): string | undefined {
  const e = data.expiresAt ?? data.expires_at ?? data.expiry;
  return typeof e === "string" ? e : undefined;
}

export async function smartUserLogin(
  email: string,
  password: string
): Promise<SmartUserResult> {
  const cfg = getConfig();
  const url = `${cfg.baseUrl}${cfg.loginPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(cfg),
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    let message = "Login failed";
    try {
      const parsed = JSON.parse(body);
      message = parsed.error ?? parsed.message ?? message;
    } catch { /* use default */ }
    throw new Error(message);
  }

  const data = await response.json();

  return {
    userId: extractUserId(data),
    email: extractEmail(data, email),
    token: extractToken(data),
    expiresAt: extractExpiresAt(data),
  };
}

export async function smartUserSignup(
  email: string,
  password: string
): Promise<SmartUserResult> {
  const cfg = getConfig();
  const url = `${cfg.baseUrl}${cfg.signupPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(cfg),
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    let message = "Signup failed";
    try {
      const parsed = JSON.parse(body);
      message = parsed.error ?? parsed.message ?? message;
    } catch { /* use default */ }
    throw new Error(message);
  }

  const data = await response.json();

  return {
    userId: extractUserId(data),
    email: extractEmail(data, email),
    token: extractToken(data),
    expiresAt: extractExpiresAt(data),
  };
}

export async function smartUserValidateSession(
  token: string
): Promise<SmartUserResult> {
  const cfg = getConfig();
  const url = `${cfg.baseUrl}${cfg.sessionPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(cfg),
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error("Session invalid or expired");
  }

  const data = await response.json();

  return {
    userId: extractUserId(data),
    email: typeof data.email === "string" ? data.email : "",
    token: extractToken(data) ?? token,
    expiresAt: extractExpiresAt(data),
  };
}

export async function smartUserLogout(token: string): Promise<void> {
  const cfg = getConfig();
  const url = `${cfg.baseUrl}${cfg.logoutPath}`;

  // Best-effort: do not throw on API failure.
  try {
    await fetch(url, {
      method: "POST",
      headers: authHeaders(cfg),
      body: JSON.stringify({ token }),
    });
  } catch {
    // Intentionally swallowed — logout is best-effort.
  }
}
