"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      await api("/auth/request-otp", { body: { email } });
      setSent(true);
    });

  const verify = (value = code) =>
    run(async () => {
      const { onboarded } = await api<{ onboarded: boolean }>("/auth/verify-otp", {
        body: { email, code: value, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      });
      router.replace(onboarded ? "/" : "/onboarding");
      router.refresh();
    });

  return (
    <>
      <form
        className="mt-10 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (sent) verify();
          else sendCode();
        }}
      >
        {!sent ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="ban@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[52px] rounded-field border border-border-strong bg-card px-4 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Mã 6 số đã gửi tới {email}</span>
            <input
              required
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                if (v.length === 6 && !busy) verify(v);
              }}
              className="h-[52px] rounded-field border border-border-strong bg-card px-4 text-center text-2xl tracking-[0.5em] outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
            />
          </label>
        )}
        <p role="alert" aria-live="polite" className="min-h-[18px] text-[13px] leading-[18px] text-destructive">
          {error}
        </p>
        <Button type="submit" size="xl" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {sent ? "Đăng nhập" : "Gửi mã đăng nhập"}
        </Button>
        {sent && (
          <Button type="button" variant="ghost" size="xl" className="font-medium" disabled={busy} onClick={() => { setSent(false); setCode(""); }}>
            Đổi email
          </Button>
        )}
      </form>
      <div className="flex-1" />
      <p className="mt-8 text-center text-[13px] leading-[18px] text-muted-foreground">
        Không cần mật khẩu. Mã đăng nhập sẽ được gửi tới email của bạn.
      </p>
    </>
  );
}
