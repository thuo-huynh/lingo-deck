import "server-only";
import { cache } from "react";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { collections } from "./db";
import { AppError } from "./errors";
import { getCookieSession } from "./session-cookie";

/** Data Access Layer entry: the signed-in user, or null. Cached per request. */
export const getCurrentUser = cache(async () => {
  const session = await getCookieSession();
  if (!session.userId || !ObjectId.isValid(session.userId)) return null;
  const { users } = await collections();
  return users.findOne({ _id: new ObjectId(session.userId) });
});

/** For pages: redirects to /login when signed out. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For route handlers: throws 401 when signed out. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new AppError(401, "Bạn cần đăng nhập");
  return user;
}
