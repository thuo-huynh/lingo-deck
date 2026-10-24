"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/bottom-sheet";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { SessionView } from "@/features/study/view";
import type { StepOutcome } from "@/features/study/session";
import { STEP_LABELS } from "@/features/study/labels";
import { FlashcardStep } from "./flashcard-step";
import { TypingStep } from "./typing-step";
import { Summary } from "./summary";

export type Current = NonNullable<SessionView["current"]>;
export type Submit = (body: Record<string, unknown>) => Promise<StepOutcome | null>;

export function StudyPlayer({ initial }: { initial: SessionView }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [exiting, setExiting] = useState(false);
  const [summary, setSummary] = useState(initial.summary);

  const active = !!view.current;
  const finished = view.status === "finished";

  async function refresh() {
    const next = await api<SessionView>(`/study/sessions/${view.id}`);
    setView(next);
    if (!next.current) setSummary(next.summary);
  }

  // Finishing is idempotent server-side; it stamps the end time for the summary.
  useEffect(() => {
    if (active || finished) return;
    api<NonNullable<SessionView["summary"]>>(`/study/sessions/${view.id}/finish`, { body: {} })
      .then(setSummary)
      .catch(() => {});
  }, [active, finished, view.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) setExiting(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const submit: Submit = async (body) => {
    try {
      return await api<StepOutcome>(`/study/sessions/${view.id}/steps`, {
        body: { itemIndex: view.current!.itemIndex, step: view.current!.step, ...body },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được kết quả");
      return null;
    }
  };

  if (!view.current) return <Summary summary={summary} />;
  const cur = view.current;
  const pct = view.totalWords ? (view.completedWords / view.totalWords) * 100 : 0;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-3 pt-4 pb-2">
        <Button variant="ghost" size="icon-lg" className="size-11 rounded-full text-body" aria-label="Thoát buổi học" onClick={() => setExiting(true)}>
          <X className="size-[22px]" strokeWidth={1.75} />
        </Button>
        <p className="text-[13px] leading-[18px] font-semibold tabular-nums">
          {view.completedWords} / {view.totalWords} từ
        </p>
        <span className="size-11" aria-hidden />
      </div>
      <div className="px-6">
        <div role="progressbar" aria-label="Tiến độ buổi học" aria-valuemin={0} aria-valuemax={view.totalWords} aria-valuenow={view.completedWords} className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 pt-5">
        {/* Step label is progress inside the current word; the bar above is progress over words (spec 7.4). */}
        <div className="flex items-center gap-3">
          <span className="grid gap-1" style={{ gridTemplateColumns: `repeat(${view.steps.length}, 20px)` }} aria-hidden>
            {view.steps.map((_, i) => (
              <span key={i} className={cn("h-1 rounded-full", i < cur.stepNumber ? "bg-primary" : "bg-border")} />
            ))}
          </span>
          <span className="text-[13px] leading-[18px] font-medium text-body">
            Bước {cur.stepNumber}/{view.steps.length} · {STEP_LABELS[cur.step]}
            {cur.isRetry && <span className="text-muted-foreground"> · ôn lại</span>}
          </span>
        </div>

        {cur.step === "FLASHCARD" ? (
          <FlashcardStep key={`${cur.itemIndex}-${cur.step}`} current={cur} submit={submit} onDone={refresh} autoplay={view.settings.audioAutoplay} />
        ) : (
          <TypingStep key={`${cur.itemIndex}-${cur.step}`} current={cur} submit={submit} onDone={refresh} autoplay={view.settings.audioAutoplay} allowHints={view.settings.allowHints} />
        )}
      </div>

      <ConfirmSheet
        open={exiting}
        onOpenChange={setExiting}
        title="Thoát buổi học?"
        description="Các từ đã trả lời được lưu. Bạn có thể học tiếp từ chỗ này sau."
        confirmLabel="Thoát"
        onConfirm={() => router.push("/")}
      />
    </div>
  );
}
