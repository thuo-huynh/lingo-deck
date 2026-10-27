/** Where sign-in may send the user back to; anything else falls back to home (no open redirect). */
export function safeNext(next: unknown) {
  return typeof next === "string" && /^\/share\/[A-Za-z0-9_-]{10,64}$/.test(next) ? next : null;
}
