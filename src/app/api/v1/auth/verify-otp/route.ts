import { handler } from "@/lib/api";
import { verifyOtp } from "@/features/auth/otp";
import { getCookieSession } from "@/lib/session-cookie";

export const POST = handler(async (req: Request) => {
  const { email, code, timezone } = await req.json();
  const user = await verifyOtp(String(email ?? ""), String(code ?? ""), String(timezone ?? ""));
  const session = await getCookieSession();
  session.userId = user._id.toHexString();
  await session.save();
  return { onboarded: user.onboarded };
});
