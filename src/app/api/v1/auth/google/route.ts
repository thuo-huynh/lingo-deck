import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sealData } from "iron-session";
import { googleAuthUrl, newPkce, OAUTH_COOKIE } from "@/features/auth/google";


/** Starts Google sign-in: PKCE verifier + state live in a short sealed cookie until the callback. */
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = new URL(req.url).origin;
  if (!clientId) return NextResponse.redirect(new URL("/login?error=google_off", origin));
  const { verifier, challenge, state } = newPkce();
  const timezone = new URL(req.url).searchParams.get("tz") ?? "";
  const sealed = await sealData({ verifier, state, timezone }, { password: process.env.SESSION_PASSWORD!, ttl: 600 });
  (await cookies()).set(OAUTH_COOKIE, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth/google",
    maxAge: 600,
  });
  return NextResponse.redirect(googleAuthUrl({ clientId, redirectUri: `${origin}/api/v1/auth/google/callback`, state, codeChallenge: challenge }));
}
