import { describe, expect, it } from "vitest";
import { googleAuthUrl, verifiedEmailFromIdToken } from "./google";

const CLIENT = "client-123.apps.googleusercontent.com";
const now = new Date("2026-10-24T08:00:00Z");
const exp = Math.floor(now.getTime() / 1000) + 600;

/** Unsigned JWT: the token comes straight from Google's token endpoint over TLS (OIDC Core 3.1.3.7). */
const jwt = (claims: Record<string, unknown>) =>
  ["e30", Buffer.from(JSON.stringify(claims)).toString("base64url"), "sig"].join(".");

const good = { iss: "https://accounts.google.com", aud: CLIENT, exp, email: "An@Gmail.com", email_verified: true };

describe("verifiedEmailFromIdToken", () => {
  it("returns the lower-cased verified email", () => {
    expect(verifiedEmailFromIdToken(jwt(good), CLIENT, now)).toBe("an@gmail.com");
  });

  it.each([
    ["another app's token", { ...good, aud: "someone-else" }],
    ["a foreign issuer", { ...good, iss: "https://evil.example" }],
    ["an expired token", { ...good, exp: exp - 1200 }],
    ["an unverified email", { ...good, email_verified: false }],
    ["a token without email", { ...good, email: undefined }],
  ])("rejects %s", (_, claims) => {
    expect(() => verifiedEmailFromIdToken(jwt(claims), CLIENT, now)).toThrow();
  });

  it("rejects garbage", () => {
    expect(() => verifiedEmailFromIdToken("not-a-jwt", CLIENT, now)).toThrow();
  });
});

describe("googleAuthUrl", () => {
  it("asks for openid email profile with PKCE S256 and the given state", () => {
    const url = new URL(googleAuthUrl({ clientId: CLIENT, redirectUri: "https://x.test/cb", state: "s1", codeChallenge: "c1" }));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: CLIENT,
      redirect_uri: "https://x.test/cb",
      response_type: "code",
      scope: "openid email profile",
      state: "s1",
      code_challenge: "c1",
      code_challenge_method: "S256",
    });
  });
});
