"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoiceList } from "@/components/choice-list";
import { api } from "@/lib/client-api";
import { LANGUAGES } from "@/features/onboarding/starter";

const STEPS = [
  {
    key: "language",
    title: "Bắt đầu với ngôn ngữ nào?",
    subtitle: "Bạn có thể học thêm ngôn ngữ khác sau: mỗi bộ từ một ngôn ngữ.",
    options: Object.entries(LANGUAGES).map(([id, l]) => ({ id, label: l.label, hint: l.native })),
  },
  {
    key: "newPerDay",
    title: "Mỗi ngày học bao nhiêu từ mới?",
    subtitle: "Từ cần ôn được tính riêng, theo lịch.",
    options: [
      { id: "5", label: "5 từ", hint: "Nhẹ nhàng" },
      { id: "10", label: "10 từ", hint: "Vừa phải · mặc định" },
      { id: "20", label: "20 từ", hint: "Nghiêm túc" },
    ],
  },
  {
    key: "stepCount",
    title: "Mỗi từ luyện mấy bước?",
    subtitle: "Nhiều bước hơn giúp nhớ chắc hơn.",
    options: [
      { id: "1", label: "1 bước", hint: "Thẻ ghi nhớ" },
      { id: "2", label: "2 bước", hint: "Thẻ ghi nhớ → Viết từ" },
      { id: "3", label: "3 bước", hint: "Thẻ ghi nhớ → Viết từ → Nghe & viết" },
    ],
  },
] as const;

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({ language: "en", newPerDay: "10", stepCount: "3" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cur = STEPS[step];
  const last = step === STEPS.length - 1;

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const { deckId } = await api<{ deckId: string }>("/onboarding", {
        body: { language: values.language, newPerDay: Number(values.newPerDay), stepCount: Number(values.stepCount) },
      });
      // "Học thử 1 từ" (spec 8.1): a one-word session straight away.
      const s = await api<{ id: string; total: number }>("/study/sessions", { body: { deckId, includeSubdecks: true, limit: 1 } });
      router.replace(s.total ? `/study/${s.id}` : "/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <div className="flex h-11 items-center gap-3">
        {step > 0 ? (
          <Button variant="ghost" size="icon-lg" aria-label="Quay lại" onClick={() => setStep(step - 1)} className="-ml-2 size-11">
            <ChevronLeft className="size-6" />
          </Button>
        ) : null}
        <div role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label="Tiến độ thiết lập" className="flex flex-1 gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <span className="text-[13px] leading-[18px] font-medium text-muted-foreground tabular-nums">{step + 1} / 3</span>
      </div>

      <h1 className="mt-8 text-2xl font-semibold">{cur.title}</h1>
      <p className="mt-2 text-body">{cur.subtitle}</p>

      <ChoiceList
        className="mt-8"
        label={cur.title}
        options={cur.options}
        value={values[cur.key]}
        onChange={(v) => setValues({ ...values, [cur.key]: v })}
      />

      <div className="flex-1" />
      <p className="mt-6 text-center text-[13px] leading-[18px] text-muted-foreground">Có thể đổi bất cứ lúc nào trong Cài đặt.</p>
      <p role="alert" className="min-h-[18px] text-center text-[13px] text-destructive">{error}</p>
      <Button size="xl" className="mt-2" disabled={busy} onClick={() => (last ? finish() : setStep(step + 1))}>
        {busy && <Loader2 className="animate-spin" />}
        {last ? "Học thử 1 từ" : "Tiếp tục"}
      </Button>
    </main>
  );
}
