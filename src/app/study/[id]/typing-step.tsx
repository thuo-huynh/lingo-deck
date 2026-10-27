"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, Lightbulb, Snail, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAnswer } from "@/features/study/diff";
import type { StepOutcome } from "@/features/study/session";
import type { Current, Submit } from "./player";
import { useAudio } from "./use-audio";
import { languageName } from "@/features/decks/languages";

type TypingCard = {
  meaningVi?: string;
  partOfSpeech?: string;
  tags?: string[];
  hints: { label: string; value: string }[];
  audioUrl?: string;
  speech?: string;
  languageCode: string;
  blanks: string;
};

export function TypingStep({
  current,
  submit,
  onDone,
  autoplay,
  allowHints,
}: {
  current: Current;
  submit: Submit;
  onDone: () => Promise<void>;
  autoplay: boolean;
  allowHints: boolean;
}) {
  const card = current.card as TypingCard;
  const listening = current.step === "AUDIO_TO_WORD";
  const [value, setValue] = useState("");
  const [hintsShown, setHintsShown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<StepOutcome | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const cont = useRef<HTMLButtonElement>(null);
  const audio = useAudio({ ...card, speech: card.speech }, listening && autoplay);
  const lang = languageName(card.languageCode) ?? "ngôn ngữ đang học";

  useEffect(() => {
    if (outcome) cont.current?.focus();
    else input.current?.focus();
  }, [outcome]);

  // Space replays audio when focus is not in the answer box (spec 7.5).
  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        audio.play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listening, audio]);

  async function send(body: Record<string, unknown>) {
    if (busy || outcome) return;
    setBusy(true);
    const out = await submit({ input: value, hintsUsed: hintsShown, ...body });
    setBusy(false);
    if (!out) return;
    if (out.evaluation.status === "skipped") return onDone();
    setOutcome(out);
  }

  const next = async () => {
    setBusy(true);
    await onDone();
  };

  const correct = outcome?.correct === true;
  const answer = outcome?.answer;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {listening ? (
          <div className="mt-12 flex flex-col items-center gap-6 text-center">
            <p className="text-[13px] leading-[18px] font-medium text-muted-foreground">Nghe rồi gõ lại từ bạn nghe được</p>
            <div className="flex items-center gap-3">
              <Button size="icon-lg" className="size-20 rounded-full" aria-label="Phát âm thanh" disabled={audio.playing} onClick={() => audio.play()}>
                <Volume2 className="size-9" strokeWidth={1.75} />
              </Button>
              <Button variant="outline" className="h-11 rounded-full px-4" disabled={audio.playing} onClick={() => audio.play(true)}>
                <Snail strokeWidth={1.75} /> Phát chậm
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center gap-2 text-center">
            <p className="text-[13px] leading-[18px] font-medium text-muted-foreground">Viết từ {lang} có nghĩa là</p>
            <p className="text-[40px] leading-[48px] font-semibold break-words">{card.meaningVi}</p>
            {(card.partOfSpeech || card.tags?.length) && (
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {[card.partOfSpeech, ...(card.tags ?? [])].filter(Boolean).map((t) => (
                  <span key={t} className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-[13px] font-medium text-body">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <form
          className="mt-10"
          onSubmit={(e) => {
            e.preventDefault();
            if (outcome) next();
            else if (value.trim()) send({});
          }}
        >
          {!outcome && card.blanks && (
            // One slot per letter, filled as you type (#3); the input below stays the real control.
            <p className="mb-4 flex flex-wrap justify-center gap-x-1.5 gap-y-2 text-2xl font-semibold" lang={card.languageCode} aria-label={`Từ có ${[...card.blanks].filter((c) => c === "_").length} chữ cái`}>
              {[...card.blanks].map((c, i) =>
                c === "_" ? (
                  <span key={i} aria-hidden className="grid h-9 w-6 place-items-end justify-center border-b-2 border-border-strong pb-0.5">
                    {[...value][i] ?? ""}
                  </span>
                ) : (
                  <span key={i} aria-hidden className={cn("grid h-9 place-items-end pb-0.5 text-muted-foreground", c === " " ? "w-3" : "w-auto")}>
                    {c === " " ? "" : c}
                  </span>
                )
              )}
            </p>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[18px] font-medium text-body">Câu trả lời của bạn</span>
            <span className="relative block">
              <input
                ref={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                // IME composition must not submit half-typed text (AC-15).
                onKeyDown={(e) => e.key === "Enter" && e.nativeEvent.isComposing && e.preventDefault()}
                readOnly={!!outcome}
                lang={card.languageCode}
                placeholder={listening ? "Gõ từ bạn nghe được…" : `Gõ từ ${lang}…`}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint={outcome ? "next" : "done"}
                aria-invalid={outcome ? !correct : undefined}
                className={cn(
                  "h-14 w-full rounded-field border bg-card pr-12 pl-4 text-xl outline-none focus-visible:ring-3",
                  !outcome && "border-border-strong focus-visible:border-primary focus-visible:ring-primary/20",
                  outcome && correct && "border-good bg-good-soft ring-good/20",
                  outcome && !correct && "border-again bg-again-soft ring-again/20"
                )}
              />
              {outcome && (correct ? (
                <Check className="absolute top-1/2 right-4 size-[22px] -translate-y-1/2 text-good" strokeWidth={2} role="img" aria-label="Đúng" />
              ) : (
                <X className="absolute top-1/2 right-4 size-[22px] -translate-y-1/2 text-again" strokeWidth={2} role="img" aria-label="Sai" />
              ))}
            </span>
          </label>

          {!outcome && hintsShown > 0 && (
            <ul className="mt-3 flex flex-col gap-2" aria-live="polite">
              {card.hints.slice(0, hintsShown).map((h, i) => (
                <li key={i} className="rounded-btn bg-muted px-4 py-3 text-[15px]">
                  <span className="text-[13px] font-medium text-muted-foreground">{h.label}: </span>
                  <span className="font-medium tracking-wide">{h.value}</span>
                </li>
              ))}
            </ul>
          )}

          {!outcome && (
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {allowHints && hintsShown < card.hints.length && (
                <Button type="button" variant="ghost" className="h-11 text-[13px] font-semibold text-primary" onClick={() => setHintsShown(hintsShown + 1)}>
                  <Lightbulb className="size-4" strokeWidth={1.75} /> Gợi ý{hintsShown ? ` (${hintsShown}/${card.hints.length})` : ""}
                </Button>
              )}
              <Button type="button" variant="ghost" className="h-11 text-[13px] font-semibold text-muted-foreground" disabled={busy} onClick={() => send({ revealed: true })}>
                <Eye className="size-4" strokeWidth={1.75} /> Xem đáp án
              </Button>
              {listening && audio.failed && (
                <Button type="button" variant="ghost" className="h-11 text-[13px] font-semibold text-muted-foreground" disabled={busy} onClick={() => send({ audioUnavailable: true })}>
                  Không nghe được? Bỏ qua, không tính điểm
                </Button>
              )}
            </div>
          )}

          {!outcome && (
            <Button type="submit" size="xl" className="mt-6 mb-[max(24px,env(safe-area-inset-bottom))] w-full" disabled={busy || !value.trim()}>
              Kiểm tra
            </Button>
          )}
        </form>
      </div>

      {outcome && answer && (
        <div
          role={correct ? "status" : "alert"}
          className={cn(
            "-mx-6 flex flex-col gap-4 rounded-t-[20px] px-6 pt-6 pb-[max(32px,env(safe-area-inset-bottom))] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200",
            correct ? "bg-good-soft" : "bg-again-soft"
          )}
        >
          <div className="flex items-start gap-3">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-white dark:text-background", correct ? "bg-good" : "bg-again")}>
              {correct ? <Check className="size-[18px]" strokeWidth={2.25} /> : <X className="size-[18px]" strokeWidth={2.25} />}
            </span>
            {correct ? (
              <div>
                <p className="font-semibold text-good">Chính xác!</p>
                <p lang={card.languageCode}>
                  {answer.term}
                  {answer.phonetic && ` · ${answer.phonetic}`}
                </p>
              </div>
            ) : (
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-semibold text-again">{value.trim() ? "Chưa đúng" : "Đáp án"}</p>
                <p className="text-[13px] leading-[18px] text-body">Đáp án đúng</p>
                <p className="text-2xl font-semibold tracking-[0.5px] break-words" lang={card.languageCode}>
                  {markAnswer(answer.term, value.trim()).map((p, i) =>
                    p.wrong && value.trim() ? (
                      <span key={i} className="text-again underline decoration-2 underline-offset-4">{p.text}</span>
                    ) : (
                      <span key={i}>{p.text}</span>
                    )
                  )}
                </p>
                {answer.phonetic && <p className="text-[13px] text-body">{answer.phonetic}</p>}
                {value.trim() && (
                  <p className="text-[13px] leading-[18px] text-body">
                    Bạn gõ: <span className="font-medium line-through decoration-again">{value.trim()}</span>
                  </p>
                )}
                {listening && (
                  <Button type="button" variant="ghost" className="-ml-3 h-10 w-fit text-[13px] text-body" onClick={() => audio.play()}>
                    <Volume2 className="size-4" strokeWidth={1.75} /> Nghe lại
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button ref={cont} size="xl" disabled={busy} onClick={next}>Tiếp tục</Button>
        </div>
      )}
    </>
  );
}
