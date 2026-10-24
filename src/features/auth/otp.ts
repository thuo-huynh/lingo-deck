import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { collections } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { UserDoc } from "@/lib/types";

const CODE_TTL_MS = 10 * 60_000;
const MAX_TRIES = 5;
const MAX_CODES_PER_WINDOW = 5;

export const emailSchema = z.string().trim().toLowerCase().email("Email không hợp lệ").max(254);

function hash(email: string, code: string) {
  return createHmac("sha256", process.env.SESSION_PASSWORD ?? "dev").update(`${email}:${code}`).digest("hex");
}

export async function requestOtp(rawEmail: string, now = new Date()) {
  const email = emailSchema.parse(rawEmail);
  const { otps } = await collections();
  const recent = await otps.countDocuments({ email, expiresAt: { $gt: now } });
  if (recent >= MAX_CODES_PER_WINDOW) throw new AppError(429, "Bạn đã yêu cầu quá nhiều mã. Thử lại sau ít phút.");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await otps.insertOne({ _id: new ObjectId(), email, codeHash: hash(email, code), expiresAt: new Date(now.getTime() + CODE_TTL_MS), tries: 0 });
  await sendCode(email, code);
  return { email };
}

/** Returns the user, creating the account on first sign-in. */
export async function verifyOtp(rawEmail: string, rawCode: string, timezone = "Asia/Ho_Chi_Minh", now = new Date()) {
  const email = emailSchema.parse(rawEmail);
  const code = z.string().trim().regex(/^\d{6}$/, "Mã gồm 6 chữ số").parse(rawCode);
  const { otps, users } = await collections();
  const candidates = await otps.find({ email, expiresAt: { $gt: now }, tries: { $lt: MAX_TRIES } }).toArray();
  const expected = Buffer.from(hash(email, code));
  const match = candidates.find((o) => timingSafeEqual(Buffer.from(o.codeHash), expected));
  if (!match) {
    await otps.updateMany({ email, expiresAt: { $gt: now } }, { $inc: { tries: 1 } });
    throw new AppError(400, "Mã không đúng hoặc đã hết hạn");
  }
  await otps.deleteMany({ email });

  const user = await users.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        email,
        timezone: isTimeZone(timezone) ? timezone : "Asia/Ho_Chi_Minh",
        dayStartHour: 4,
        dailyGoal: 10,
        onboarded: false,
        createdAt: now,
      } satisfies Omit<UserDoc, "displayName">,
    },
    { upsert: true, returnDocument: "after" }
  );
  return user!;
}

function isTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

async function sendCode(email: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.info(`[dev] Mã đăng nhập cho ${email}: ${code}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `${code} là mã đăng nhập LingoDeck`,
      text: `Mã đăng nhập của bạn: ${code}\n\nMã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
    }),
  });
  if (!res.ok) throw new AppError(429, "Không gửi được email. Thử lại sau.");
}
