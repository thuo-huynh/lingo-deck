import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unsealData } from "iron-session";
import { exchangeCode, OAUTH_COOKIE, verifiedEmailFromIdToken } from "@/features/auth/google";
import { findOrCreateUser } from "@/features/auth/users";
import { getCookieSession } from "@/lib/session-cookie";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin));
  const jar = await cookies();
  const sealed = jar.get(OAUTH_COOKIE)?.value;
  jar.delete({ name: OAUTH_COOKIE, path: "/api/v1/auth/google" });

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  if (!code || !sealed) return fail(url.searchParams.get("error") === "access_denied" ? "google_cancel" : "google");
  const pending = await unsealData<{ verifier?: string; state?: string; timezone?: string }>(sealed, { password: process.env.SESSION_PASSWORD!, ttl: 600 });
  // State must round-trip unchanged, or this callback was not started by this browser (CSRF).
  if (!pending.verifier || !pending.state || !same(pending.state, state)) return fail("google");

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const idToken = await exchangeCode({
      code,
      verifier: pending.verifier,
      clientId,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${url.origin}/api/v1/auth/google/callback`,
    });
    const user = await findOrCreateUser(verifiedEmailFromIdToken(idToken, clientId), pending.timezone);
    const session = await getCookieSession();
    session.userId = user._id.toHexString();
    await session.save();
    return NextResponse.redirect(new URL(user.onboarded ? "/" : "/onboarding", url.origin));
  } catch (e) {
    console.error("Google sign-in failed", e instanceof Error ? e.message : e);
    return fail("google");
  }
}
