import { describe, expect, it, vi } from "vitest";
import { setupTestMongo } from "@/test/mongo";
import { requestOtp, verifyOtp } from "./otp";

setupTestMongo();

async function codeFor(email: string, ip = "203.0.113.1") {
  const spy = vi.spyOn(console, "info").mockImplementation(() => {});
  await requestOtp(email, ip);
  const code = String(spy.mock.calls.at(-1)?.[0]).match(/(\d{6})$/)![1];
  spy.mockRestore();
  return code;
}

describe("email OTP", () => {
  it("signs in with the emailed code and creates the account once", async () => {
    const code = await codeFor("An@Example.com ");
    const user = await verifyOtp("an@example.com", code);
    expect(user.email).toBe("an@example.com");
    expect(user.onboarded).toBe(false);

    const again = await verifyOtp("an@example.com", await codeFor("an@example.com"));
    expect(again._id).toEqual(user._id);
  });

  it("rejects a wrong code and a reused code", async () => {
    const code = await codeFor("b@example.com");
    const wrong = code === "000000" ? "111111" : "000000";
    await expect(verifyOtp("b@example.com", wrong)).rejects.toThrow("Mã không đúng");
    await verifyOtp("b@example.com", code);
    await expect(verifyOtp("b@example.com", code)).rejects.toThrow("Mã không đúng");
  });

  it("locks the code after 5 wrong tries", async () => {
    const code = await codeFor("c@example.com");
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) await expect(verifyOtp("c@example.com", wrong)).rejects.toThrow();
    await expect(verifyOtp("c@example.com", code)).rejects.toThrow("Mã không đúng");
  });

  it("rate-limits code requests", async () => {
    for (let i = 0; i < 5; i++) await codeFor("d@example.com");
    await expect(codeFor("d@example.com")).rejects.toThrow("quá nhiều");
  });

  it("rate-limits one sender spraying many addresses", async () => {
    for (let i = 0; i < 10; i++) await codeFor(`victim${i}@example.com`, "198.51.100.7");
    await expect(codeFor("victim10@example.com", "198.51.100.7")).rejects.toThrow("quá nhiều");
    await expect(codeFor("someone@example.com", "198.51.100.8")).resolves.toMatch(/^\d{6}$/);
  });
});
