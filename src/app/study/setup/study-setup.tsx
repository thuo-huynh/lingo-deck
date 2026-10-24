"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/segmented";
import { inputClass } from "@/components/field";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { STEP_LABELS } from "@/features/study/labels";
import type { StepType } from "@/features/study/attempt";

const ALL: StepType[] = ["FLASHCARD", "MEANING_TO_WORD", "AUDIO_TO_WORD"];
const MODES = [
  { value: "scheduled", label: "Ôn theo lịch" },
  { value: "practice", label: "Luyện tập" },
  { value: "failed", label: "Từ sai" },
] as const;
const MODE_HINT = {
  scheduled: "Kết quả cập nhật lịch ôn.",
  practice: "Chỉ luyện, không thay đổi lịch ôn.",
  failed: "Ôn lại các từ đã sai hôm nay. Không thay đổi lịch ôn.",
};

type Deck = { id: string; label: string; color: string; hasChildren: boolean; steps: StepType[] };

export function StudySetup({ decks, initialDeckId, initialMode }: { decks: Deck[]; initialDeckId: string; initialMode: "scheduled" | "practice" }) {
  const router = useRouter();
  const [deckId, setDeckId] = useState(initialDeckId);
  const deck = decks.find((d) => d.id === deckId)!;
  const [sub, setSub] = useState(true);
  const [limit, setLimit] = useState<number | "">("");
  const [stepCount, setStepCount] = useState<1 | 2 | 3 | null>(null);
  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>(initialMode);
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Without a quick switch, the deck's own (possibly custom-ordered) steps apply.
  const steps = stepCount ? ALL.slice(0, stepCount) : deck.steps;

  async function start() {
    setBusy(true);
    setError(null);
    setEmpty(false);
    try {
      const s = await api<{ id: string; total: number }>("/study/sessions", {
        body: {
          deckId,
          includeSubdecks: sub,
          steps,
          limit: limit || (mode === "scheduled" ? undefined : 20),
          mode: mode === "scheduled" ? "DAILY" : "CUSTOM",
          filter: mode === "failed" ? "failed_today" : mode === "practice" ? "all" : undefined,
        },
      });
      if (!s.total) {
        setEmpty(true);
        setBusy(false);
        return;
      }
      router.push(`/study/${s.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-end bg-[rgba(24,29,38,0.32)] dark:bg-[rgba(0,0,0,0.56)]">
      <div role="dialog" aria-labelledby="setup-title" className="mx-auto w-full max-w-md rounded-t-[20px] bg-card px-6 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
        <span className="mx-auto mb-3 block h-1 w-9 rounded-full bg-border-strong" aria-hidden />
        <div className="flex items-center justify-between">
          <h1 id="setup-title" className="text-2xl font-semibold">Bạn muốn học thế nào?</h1>
          <Button asChild variant="ghost" size="icon-lg" className="-mr-2 size-11">
            <Link href="/" aria-label="Đóng"><X className="size-6" strokeWidth={1.75} /></Link>
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Bộ từ</span>
            <span className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 size-2.5 -translate-y-1/2 rounded-full" style={{ background: deck.color }} />
              <select className={cn(inputClass, "pl-9")} value={deckId} onChange={(e) => setDeckId(e.target.value)}>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </span>
          </label>

          {deck.hasChildren && (
            <div className="flex min-h-11 items-center justify-between">
              <label htmlFor="sub" className="font-medium">Bao gồm bộ con</label>
              <Switch id="sub" checked={sub} onCheckedChange={setSub} className="h-[26px] w-[44px]" />
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Số từ</span>
            <select className={inputClass} value={limit} onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : "")}>
              <option value="">{mode === "scheduled" ? "Theo hạn mức hôm nay" : "20 từ"}</option>
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} từ</option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Bài tập</span>
            <Segmented
              label="Số bước luyện"
              value={stepCount ?? (deck.steps.join() === ALL.slice(0, deck.steps.length).join() ? (deck.steps.length as 1 | 2 | 3) : 0)}
              onChange={(n) => setStepCount(n as 1 | 2 | 3)}
              options={[1, 2, 3].map((n) => ({ value: n, label: `${n} bước` }))}
            />
            <span className="text-[13px] leading-[18px] text-muted-foreground">{steps.map((s) => STEP_LABELS[s]).join(" → ")}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Chế độ</span>
            <Segmented label="Chế độ học" value={mode} onChange={setMode} options={MODES} />
            <span className="text-[13px] leading-[18px] text-muted-foreground">{MODE_HINT[mode]}</span>
          </div>

          <div aria-live="polite" className="min-h-[18px] text-[13px] leading-[18px]">
            {empty && (
              <span className="text-body">
                {mode === "scheduled" ? "Hôm nay không còn từ nào cần học trong bộ này. Thử chế độ Luyện tập nhé!" : "Không có từ nào phù hợp."}
              </span>
            )}
            {error && <span className="text-destructive">{error}</span>}
          </div>
          <Button size="xl" disabled={busy} onClick={start}>
            {busy && <Loader2 className="animate-spin" />}
            Bắt đầu học
          </Button>
        </div>
      </div>
    </div>
  );
}
