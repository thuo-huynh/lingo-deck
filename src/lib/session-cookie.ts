import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type CookieSession = { userId?: string };

export const SESSION_COOKIE = "ld_session";

function options(): SessionOptions {
  const password = process.env.SESSION_PASSWORD;
  if (!password || password.length < 32) throw new Error("SESSION_PASSWORD must be at least 32 characters");
  return {
    password,
    cookieName: SESSION_COOKIE,
    ttl: 60 * 60 * 24 * 90, // installed PWAs should not log out every week
    cookieOptions: { secure: process.env.NODE_ENV === "production", sameSite: "lax", httpOnly: true },
  };
}

export async function getCookieSession() {
  return getIronSession<CookieSession>(await cookies(), options());
}
