"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/segmented";
import { inputClass } from "@/components/field";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { DeckSettings } from "@/lib/types";
import type { StepType } from "@/features/study/attempt";
import { STEP_LABELS } from "@/features/study/labels";
import { DEFAULT_LEECH_THRESHOLD } from "@/features/decks/settings";

const ALL: StepType[] = ["FLASHCARD", "MEANING_TO_WORD", "AUDIO_TO_WORD"];

/** Edits a full preset. `endpoint` receives PUT with the settings object. */
export function SettingsForm({ initial, endpoint, footer }: { initial: DeckSettings; endpoint: string; footer?: React.ReactNode }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [adv, setAdv] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof DeckSettings>(k: K, v: DeckSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const isPrefix = s.steps.join() === ALL.slice(0, s.steps.length).join();

  async function save() {
    setBusy(true);
    try {
      await api(endpoint, { method: "PUT", body: s });
      toast.success("Đã lưu cài đặt");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được");
    } finally {
      setBusy(false);
    }
  }

  const toggleStep = (step: StepType) => {
    const has = s.steps.includes(step);
    if (has && s.steps.length === 1) return; // at least one step (spec 4.1)
    set("steps", has ? s.steps.filter((x) => x !== step) : [...s.steps, step]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-card border border-border bg-card">
        <Stepper label="Từ mới mỗi ngày" value={s.newPerDay} step={5} min={0} max={200} onChange={(v) => set("newPerDay", v)} />
        <Stepper label="Ôn tối đa mỗi ngày" value={s.maxReviewsPerDay} step={10} min={0} max={9999} onChange={(v) => set("maxReviewsPerDay", v)} border />
        <div className="flex flex-col gap-2 border-t border-border p-4">
          <span className="font-medium">Bước học mặc định</span>
          <Segmented
            label="Bước học mặc định"
            value={isPrefix ? s.steps.length : 0}
            onChange={(n) => set("steps", ALL.slice(0, n))}
            options={[1, 2, 3].map((n) => ({ value: n, label: `${n} bước` }))}
          />
          <span className="text-[13px] leading-[18px] text-muted-foreground">{s.steps.map((x) => STEP_LABELS[x]).join(" → ")}</span>
        </div>
        <Toggle label="Tự phát âm thanh" checked={s.audioAutoplay} onChange={(v) => set("audioAutoplay", v)} />
        <Toggle label="Cho phép gợi ý" checked={s.allowHints} onChange={(v) => set("allowHints", v)} />
        <Toggle label="Hiện phiên âm trên thẻ" checked={s.showPhonetic} onChange={(v) => set("showPhonetic", v)} />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card">
        <button type="button" aria-expanded={adv} onClick={() => setAdv(!adv)} className="flex min-h-14 w-full items-center justify-between px-4 font-medium">
          Nâng cao
          <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", adv && "rotate-180")} strokeWidth={1.75} />
        </button>
        {adv && (
          <div className="flex flex-col gap-4 border-t border-border p-4">
            <div className="flex flex-col gap-2">
              <span className="text-[13px] leading-[18px] font-medium text-body">Thứ tự và chọn bước (tuỳ chỉnh)</span>
              <div className="flex flex-col gap-2">
                {[...s.steps, ...ALL.filter((x) => !s.steps.includes(x))].map((step) => {
                  const on = s.steps.includes(step);
                  const i = s.steps.indexOf(step);
                  return (
                    <div key={step} className="flex min-h-11 items-center gap-3">
                      <Switch checked={on} onCheckedChange={() => toggleStep(step)} aria-label={STEP_LABELS[step]} />
                      <span className={cn("flex-1", !on && "text-muted-foreground")}>{on ? `${i + 1}. ` : ""}{STEP_LABELS[step]}</span>
                      {on && i > 0 && (
                        <Button type="button" variant="ghost" className="h-11" onClick={() => { const n = [...s.steps]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set("steps", n); }}>
                          Lên
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="flex justify-between text-[13px] leading-[18px] font-medium text-body">
                Tỉ lệ nhớ mong muốn <span className="tabular-nums text-foreground">{Math.round(s.desiredRetention * 100)}%</span>
              </span>
              <input type="range" min={70} max={97} value={Math.round(s.desiredRetention * 100)} onChange={(e) => set("desiredRetention", Number(e.target.value) / 100)} className="h-11 accent-primary" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] leading-[18px] font-medium text-body">Learning steps</span>
              <input className={inputClass} defaultValue={s.learningSteps.join(" ")} onBlur={(e) => set("learningSteps", e.target.value.split(/\s+/).filter(Boolean))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] leading-[18px] font-medium text-body">Relearning steps</span>
              <input className={inputClass} defaultValue={s.relearningSteps.join(" ")} onBlur={(e) => set("relearningSteps", e.target.value.split(/\s+/).filter(Boolean))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] leading-[18px] font-medium text-body">Khoảng ôn tối đa (ngày)</span>
              <input type="number" inputMode="numeric" min={1} max={36500} className={inputClass} value={s.maximumInterval} onChange={(e) => set("maximumInterval", Number(e.target.value) || 1)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] leading-[18px] font-medium text-body">Đánh dấu “khó nhớ” sau số lần quên</span>
              <input type="number" inputMode="numeric" min={2} max={99} className={inputClass} value={s.leechThreshold ?? DEFAULT_LEECH_THRESHOLD} onChange={(e) => set("leechThreshold", Number(e.target.value) || DEFAULT_LEECH_THRESHOLD)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] leading-[18px] font-medium text-body">Khi một từ bị đánh dấu khó nhớ</span>
              <select className={inputClass} value={s.leechAction ?? "flag"} onChange={(e) => set("leechAction", e.target.value as "flag" | "suspend")}>
                <option value="flag">Chỉ gắn nhãn “Khó nhớ”</option>
                <option value="suspend">Gắn nhãn và tạm dừng từ</option>
              </select>
            </label>
            <div className="flex min-h-11 items-center justify-between">
              <span>Phân biệt hoa/thường khi gõ</span>
              <Switch checked={s.caseSensitive} onCheckedChange={(v) => set("caseSensitive", v)} />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] leading-[18px] font-medium text-body">Thứ tự trong ngày</span>
              <select className={inputClass} value={s.order} onChange={(e) => set("order", e.target.value as DeckSettings["order"])}>
                <option value="REVIEW_FIRST">Ôn trước, từ mới sau</option>
                <option value="NEW_FIRST">Từ mới trước</option>
                <option value="MIX">Trộn lẫn</option>
              </select>
            </label>
            <p className="text-[13px] leading-[18px] text-muted-foreground">Đổi cài đặt không xóa tiến độ, chỉ ảnh hưởng các lượt ôn sau.</p>
          </div>
        )}
      </div>
      {footer}
      <Button size="xl" disabled={busy} onClick={save}>
        {busy && <Loader2 className="animate-spin" />}
        Lưu cài đặt
      </Button>
    </div>
  );
}

function Stepper({ label, value, step, min, max, onChange, border }: { label: string; value: number; step: number; min: number; max: number; onChange: (v: number) => void; border?: boolean }) {
  return (
    <div className={cn("flex min-h-16 items-center justify-between px-4", border && "border-t border-border")}>
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-1">
        <Button type="button" variant="secondary" size="icon-lg" className="size-11 rounded-full" aria-label={`Giảm ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
          <Minus strokeWidth={1.75} />
        </Button>
        <span aria-live="polite" className="w-12 text-center text-base font-semibold tabular-nums">{value}</span>
        <Button type="button" variant="secondary" size="icon-lg" className="size-11 rounded-full" aria-label={`Tăng ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
          <Plus strokeWidth={1.75} />
        </Button>
      </span>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-14 items-center justify-between border-t border-border px-4">
      <span className="font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
