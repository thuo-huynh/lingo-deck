import { handler } from "@/lib/api";
import { requestOtp } from "@/features/auth/otp";

export const POST = handler(async (req: Request) => {
  const { email } = await req.json();
  // Vercel and most proxies put the client first in x-forwarded-for.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return requestOtp(String(email ?? ""), ip);
});
