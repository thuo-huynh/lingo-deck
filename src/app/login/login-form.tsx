"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const ERRORS: Record<string, string> = {
  google: "Không đăng nhập được bằng Google. Thử lại nhé.",
  google_cancel: "Bạn đã huỷ đăng nhập Google.",
  google_off: "Đăng nhập Google chưa được bật.",
};

export function LoginForm({ emailEnabled, googleEnabled, initialError }: { emailEnabled: boolean; googleEnabled: boolean; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ? (ERRORS[initialError] ?? null) : null);

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

  // The browser's time zone rides along so a new account starts with the right study day.
  const googleHref = () => `/api/v1/auth/google?tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`;

  return (
    <>
      {googleEnabled && (
        <a
          href="/api/v1/auth/google"
          onClick={(e) => {
            e.currentTarget.href = googleHref();
          }}
          className="mt-10 flex h-[52px] items-center justify-center gap-3 rounded-btn border border-border-strong bg-card text-base font-medium outline-none focus-visible:ring-3 focus-visible:ring-primary/20"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
          </svg>
          Tiếp tục với Google
        </a>
      )}
      {googleEnabled && emailEnabled && (
        <div className="my-6 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-border" />
          <span className="text-[13px] leading-[18px] font-medium text-muted-foreground">hoặc</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
      {!emailEnabled && error && (
        <p role="alert" className="mt-4 text-[13px] leading-[18px] text-destructive">{error}</p>
      )}
      {emailEnabled && (
      <form
        className={cn("flex flex-col gap-4", !googleEnabled && "mt-10")}
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
      )}
      <div className="flex-1" />
      <p className="mt-8 text-center text-[13px] leading-[18px] text-muted-foreground">
        {emailEnabled ? "Không cần mật khẩu. Mã đăng nhập sẽ được gửi tới email của bạn." : "Không cần mật khẩu."}
      </p>
    </>
  );
}
