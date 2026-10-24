"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUp, Minus, RefreshCw, RotateCcw, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Rating } from "@/features/study/attempt";
import type { Current, Submit } from "./player";
import { useAudio } from "./use-audio";

type FlashCard = {
  term: string;
  phonetic?: string;
  meaningVi: string;
  partOfSpeech?: string;
  examples: { text: string; translationVi?: string }[];
  notes?: string;
  imageUrl?: string;
  audioUrl?: string;
  speech: string;
  languageCode: string;
  tags?: string[];
  intervals?: Record<Rating, string>;
};

const RATINGS = [
  { value: "again", label: "Chưa nhớ", icon: RotateCcw, cls: "bg-again-soft text-again" },
  { value: "hard", label: "Khó", icon: Minus, cls: "bg-hard-soft text-hard" },
  { value: "good", label: "Nhớ", icon: Check, cls: "bg-good-soft text-good" },
  { value: "easy", label: "Rất dễ", icon: ChevronsUp, cls: "bg-easy-soft text-easy" },
] as const;

function highlight(text: string, term: string) {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-primary">{text.slice(i, i + term.length)}</span>
      {text.slice(i + term.length)}
    </>
  );
}

export function FlashcardStep({ current, submit, onDone, autoplay }: { current: Current; submit: Submit; onDone: () => Promise<void>; autoplay: boolean }) {
  const card = current.card as FlashCard;
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const audio = useAudio(card, autoplay);
  const flipRef = useRef<HTMLButtonElement>(null);

  async function rate(r: Rating) {
    if (busy) return;
    setBusy(true);
    const out = await submit({ selfRating: r });
    if (out) await onDone();
    else setBusy(false);
  }

  useEffect(() => {
    flipRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!flipped && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        rate(RATINGS[Number(e.key) - 1].value);
      } else if (flipped && e.key === " ") {
        e.preventDefault();
        audio.play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const listen = (
    <Button variant="secondary" size="icon-lg" className="size-12 rounded-full" aria-label="Nghe phát âm" disabled={audio.playing} onClick={() => audio.play()}>
      <Volume2 className="size-6" strokeWidth={1.75} />
    </Button>
  );

  return (
    <>
      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-card border border-border bg-card p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
        {!flipped ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            {listen}
            <div>
              <p className="text-[40px] leading-[48px] font-semibold break-words" lang={card.languageCode}>{card.term}</p>
              {card.phonetic && <p className="mt-1 text-body">{card.phonetic}</p>}
            </div>
            <p className="text-[13px] leading-[18px] text-muted-foreground">Tự nhớ nghĩa rồi lật thẻ</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold break-words" lang={card.languageCode}>{card.term}</p>
                {card.phonetic && <p className="text-body">{card.phonetic}</p>}
              </div>
              {listen}
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-2xl font-semibold">{card.meaningVi}</p>
              {(card.partOfSpeech || card.tags?.length) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {[card.partOfSpeech, ...(card.tags ?? [])].filter(Boolean).map((t) => (
                    <span key={t} className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-[13px] font-medium text-body">{t}</span>
                  ))}
                </div>
              )}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed R2 redirect, not optimizable */}
            {card.imageUrl && <img src={card.imageUrl} alt="" className="max-h-40 w-full rounded-btn object-cover" />}
            {card.examples.map((ex, i) => (
              <div key={i} className="rounded-btn bg-muted p-4">
                <p lang={card.languageCode}>{highlight(ex.text, card.term)}</p>
                {ex.translationVi && <p className="mt-1 text-[13px] leading-[18px] text-body">{ex.translationVi}</p>}
              </div>
            ))}
            {card.notes && <p className="text-[13px] leading-[18px] whitespace-pre-line text-body">{card.notes}</p>}
          </div>
        )}
      </div>

      <div className="pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        {!flipped ? (
          <Button ref={flipRef} size="xl" className="w-full" onClick={() => setFlipped(true)}>
            <RefreshCw strokeWidth={1.75} /> Lật thẻ
          </Button>
        ) : (
          <>
            <p className="mb-3 text-center text-[13px] leading-[18px] font-medium text-body">Bạn nhớ từ này thế nào?</p>
            <div role="group" aria-label="Tự đánh giá" className="grid grid-cols-4 gap-2">
              {RATINGS.map(({ value, label, icon: Icon, cls }) => (
                <button
                  key={value}
                  type="button"
                  disabled={busy}
                  onClick={() => rate(value)}
                  className={cn("flex min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-btn px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60", cls)}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  <span className="text-[13px] leading-[18px] font-semibold">{label}</span>
                  {card.intervals && <span className="text-[12px] leading-4 opacity-80 tabular-nums">{card.intervals[value]}</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
