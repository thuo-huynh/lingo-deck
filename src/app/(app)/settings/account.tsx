"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/field";
import { api } from "@/lib/client-api";

export function AccountSection(props: { email: string; dailyGoal: number; dayStartHour: number; displayName: string; timezone: string }) {
  const router = useRouter();
  const [v, setV] = useState(props);

  async function save() {
    try {
      await api("/me", { method: "PATCH", body: { displayName: v.displayName, dailyGoal: v.dailyGoal, dayStartHour: v.dayStartHour, timezone: v.timezone } });
      toast.success("Đã lưu");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được");
    }
  }

  async function logout() {
    await api("/auth/logout", { body: {} }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <section className="mt-10 flex flex-col gap-4" aria-labelledby="account-title">
      <h2 id="account-title" className="text-base font-semibold">Tài khoản</h2>
      <p className="text-[13px] text-muted-foreground">{props.email}</p>
      <Field label="Tên hiển thị">
        <input className={inputClass} maxLength={60} value={v.displayName} onChange={(e) => setV({ ...v, displayName: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mục tiêu (từ/ngày)">
          <input type="number" inputMode="numeric" min={1} max={200} className={inputClass} value={v.dailyGoal} onChange={(e) => setV({ ...v, dailyGoal: Number(e.target.value) || 1 })} />
        </Field>
        <Field label="Ngày mới bắt đầu lúc">
          <select className={inputClass} value={v.dayStartHour} onChange={(e) => setV({ ...v, dayStartHour: Number(e.target.value) })}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Múi giờ">
        <select className={inputClass} value={v.timezone} onChange={(e) => setV({ ...v, timezone: e.target.value })}>
          {Intl.supportedValuesOf("timeZone").map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </Field>
      <Button variant="outline" size="xl" className="font-medium" onClick={save}>Lưu tài khoản</Button>
      <Button variant="ghost" size="xl" className="font-medium text-destructive" onClick={logout}>
        <LogOut strokeWidth={1.75} /> Đăng xuất
      </Button>
    </section>
  );
}
