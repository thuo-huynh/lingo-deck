import { handler } from "@/lib/api";
import { requestOtp } from "@/features/auth/otp";

export const POST = handler(async (req: Request) => {
  const { email } = await req.json();
  return requestOtp(String(email ?? ""));
});
