import "server-only";
import type { ObjectId } from "mongodb";
import { collections } from "@/lib/db";
import type { SessionDoc, VocabDoc } from "@/lib/types";
import { schedule } from "@/features/scheduling/fsrs";
import { evaluateAttempt, type Rating, type StepType } from "./attempt";
import { summarize } from "./session";

export const mediaUrl = (key?: string) => (key ? `/api/v1/media/${key}` : undefined);

function mask(text: string, term: string) {
  const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return text.replace(rx, "_____");
}

/** Hints never contain the whole answer (spec 4.3 answer_leakage). */
export function buildHints(word: Pick<VocabDoc, "term" | "hints" | "examples" | "partOfSpeech">) {
  const chars = [...word.term];
  const out: { label: string; value: string }[] = [];
  for (const h of word.hints.filter((h) => h.type === "custom")) out.push({ label: "Gợi ý", value: h.value });
  if (chars.length > 1) {
    out.push({ label: "Chữ cái đầu", value: chars[0] });
    out.push({ label: "Số ký tự", value: `${chars.filter((c) => c !== " ").length} chữ cái` });
  }
  if (chars.length > 3) {
    out.push({ label: "Điền khuyết", value: chars.map((c, i) => (c === " " ? " " : i === 0 || i === chars.length - 1 ? c : "_")).join(" ") });
  }
  const ex = word.examples.find((e) => e.text.toLowerCase().includes(word.term.toLowerCase()));
  if (ex) out.push({ label: "Ví dụ", value: mask(ex.text, word.term) + (ex.translationVi ? ` — ${ex.translationVi}` : "") });
  return out;
}

export function formatInterval(ms: number) {
  const min = Math.round(ms / 60_000);
  if (min < 1) return "<1 phút";
  if (min < 60) return `${min} phút`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} giờ`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} ngày`;
  const m = Math.round(d / 30);
  return m < 12 ? `${m} tháng` : `${Math.round(d / 365)} năm`;
}

/** Next-review previews, only meaningful when the self-rating is the attempt's final rating. */
function previews(word: VocabDoc, session: SessionDoc, now: Date) {
  if (session.rescheduleMode !== "scheduled" || session.steps.length !== 1 || session.steps[0] !== "FLASHCARD") return undefined;
  const out = {} as Record<Rating, string>;
  for (const r of ["again", "hard", "good", "easy"] as const) {
    out[r] = formatInterval(schedule(word.srs, r, now, session.settings).due.getTime() - now.getTime());
  }
  return out;
}

export function cardFor(step: StepType, word: VocabDoc, session: SessionDoc, now = new Date()) {
  const base = {
    languageCode: word.languageCode,
    partOfSpeech: word.partOfSpeech,
    imageUrl: mediaUrl(word.imageKey),
  };
  if (step === "FLASHCARD") {
    return {
      ...base,
      term: word.term,
      phonetic: session.settings.showPhonetic ? word.phonetic : undefined,
      meaningVi: word.meaningVi,
      examples: word.examples,
      notes: word.notes,
      audioUrl: mediaUrl(word.audioKey),
      speech: word.term,
      tags: word.tags,
      intervals: previews(word, session, now),
    };
  }
  const hints = session.settings.allowHints ? buildHints(word) : [];
  if (step === "MEANING_TO_WORD") return { ...base, meaningVi: word.meaningVi, tags: word.tags, hints };
  // Browser TTS needs the text on the device; it is never rendered before the answer (spec 4.2.C).
  return { ...base, audioUrl: mediaUrl(word.audioKey), speech: word.term, hints: hints.filter((h) => h.label !== "Ví dụ") };
}

export async function sessionView(session: SessionDoc, userId: ObjectId) {
  const index = session.items.findIndex((i) => i.status === "pending");
  const words = new Set(session.items.map((i) => i.vocabId.toHexString()));
  const finished = new Set(session.items.filter((i) => i.status !== "pending").map((i) => i.vocabId.toHexString()));
  // A word counts once in progress even if it was re-queued after a mistake.
  const stillPending = new Set(session.items.filter((i) => i.status === "pending").map((i) => i.vocabId.toHexString()));
  const completed = [...finished].filter((id) => !stillPending.has(id)).length;

  let current = null;
  if (index >= 0 && session.status === "active") {
    const item = session.items[index];
    const { vocab } = await collections();
    const word = await vocab.findOne({ _id: item.vocabId, ownerId: userId });
    const progress = evaluateAttempt(session.steps, item.results);
    if (word && progress.status === "in_progress") {
      current = {
        itemIndex: index,
        step: progress.nextStep,
        stepNumber: item.results.length + 1,
        isRetry: session.items.slice(0, index).some((i) => i.vocabId.equals(item.vocabId)),
        card: cardFor(progress.nextStep, word, session),
      };
    }
  }
  return {
    id: session._id.toHexString(),
    status: session.status,
    steps: session.steps,
    rescheduleMode: session.rescheduleMode,
    settings: { audioAutoplay: session.settings.audioAutoplay, allowHints: session.settings.allowHints },
    totalWords: words.size,
    completedWords: completed,
    current,
    summary: index < 0 || session.status === "finished" ? summarize(session) : null,
  };
}

export type SessionView = Awaited<ReturnType<typeof sessionView>>;
