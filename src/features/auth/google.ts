import { createHash, randomBytes } from "node:crypto";
import { AppError } from "@/lib/errors";

/** Holds the PKCE verifier and state between the redirect to Google and the callback. */
export const OAUTH_COOKIE = "ld_oauth";

const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export function googleAuthUrl(p: { clientId: string; redirectUri: string; state: string; codeChallenge: string }) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: p.state,
    code_challenge: p.codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export function newPkce() {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url"), state: randomBytes(16).toString("base64url") };
}

/**
 * Claims check for an ID token received directly from Google's token endpoint over TLS,
 * where OIDC Core 3.1.3.7 allows skipping the signature check. Never call this on a token from the browser.
 */
export function verifiedEmailFromIdToken(idToken: string, clientId: string, now = new Date()) {
  let claims: { iss?: string; aud?: string; exp?: number; email?: string; email_verified?: boolean | string };
  try {
    claims = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
  } catch {
    throw new AppError(400, "Phản hồi đăng nhập Google không hợp lệ");
  }
  const ok =
    ISSUERS.includes(claims.iss ?? "") &&
    claims.aud === clientId &&
    typeof claims.exp === "number" &&
    claims.exp * 1000 > now.getTime() &&
    (claims.email_verified === true || claims.email_verified === "true") &&
    typeof claims.email === "string";
  if (!ok) throw new AppError(400, "Không xác minh được tài khoản Google");
  return claims.email!.trim().toLowerCase();
}

export async function exchangeCode(p: { code: string; verifier: string; clientId: string; clientSecret: string; redirectUri: string }) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: p.code,
      code_verifier: p.verifier,
      client_id: p.clientId,
      client_secret: p.clientSecret,
      redirect_uri: p.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { id_token?: string };
  if (!res.ok || !data.id_token) throw new AppError(400, "Google từ chối đăng nhập. Thử lại nhé.");
  return data.id_token;
}
