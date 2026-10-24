import "server-only";
import { ObjectId, type ClientSession } from "mongodb";
import { z } from "zod";
import { collections, getClient } from "@/lib/db";
import { studyDay } from "@/lib/day";
import { AppError, conflict, notFound, parseId } from "@/lib/errors";
import type { DeckSettings, ReviewLogDoc, SessionDoc, SessionItem, VocabDoc } from "@/lib/types";
import { getDeckSettings, getOwnedDeck } from "@/features/decks/service";
import { stepsSchema } from "@/features/decks/settings";
import { ALGORITHM, schedule } from "@/features/scheduling/fsrs";
import { checkAnswer } from "./answer";
import { evaluateAttempt, type AttemptEvaluation, type StepResult } from "./attempt";

type Learner = { _id: ObjectId; timezone: string; dayStartHour: number };

/** A failed word comes back later in the same session, but not forever. */
const MAX_TRIES_PER_SESSION = 3;

export const createSessionInput = z.object({
  deckId: z.string(),
  includeSubdecks: z.boolean().default(true),
  mode: z.enum(["DAILY", "CUSTOM"]).default("DAILY"),
  rescheduleMode: z.enum(["scheduled", "practice_only"]).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  steps: stepsSchema.optional(),
  /** CUSTOM only */
  filter: z.enum(["failed_today", "all", "tag"]).optional(),
  tag: z.string().max(40).optional(),
});

export async function createSession(user: Learner, raw: z.input<typeof createSessionInput>, now = new Date()) {
  const input = createSessionInput.parse(raw);
  const deck = await getOwnedDeck(user._id, input.deckId);
  const settings = await getDeckSettings(user._id, deck);
  const { vocab, reviewLogs, sessions } = await collections();
  const scope = {
    ownerId: user._id,
    status: "active" as const,
    ...(input.includeSubdecks ? { deckPath: deck._id } : { deckId: deck._id }),
  };
  const day = studyDay(now, user.timezone, user.dayStartHour);
  // Cram / custom study never touches the schedule unless explicitly asked (spec 6.2).
  const rescheduleMode = input.rescheduleMode ?? (input.mode === "DAILY" ? "scheduled" : "practice_only");

  let picked: { word: VocabDoc; isNew: boolean }[];
  if (input.mode === "DAILY") {
    const [reviewsDone, introduced] = await Promise.all([
      reviewLogs.countDocuments({
        userId: user._id,
        rescheduleMode: "scheduled",
        reviewedAt: { $gte: day.start },
        "previous.state": { $ne: "NEW" },
      }),
      vocab.countDocuments({ ownerId: user._id, "srs.introducedAt": { $gte: day.start } }),
    ]);
    const [due, fresh] = await Promise.all([
      vocab
        .find({ ...scope, "srs.state": { $ne: "NEW" }, "srs.due": { $lt: day.end } })
        .sort({ "srs.due": 1 })
        .limit(Math.max(0, settings.maxReviewsPerDay - reviewsDone))
        .toArray(),
      vocab
        .find({ ...scope, "srs.state": "NEW" })
        .sort({ createdAt: 1 })
        .limit(Math.max(0, settings.newPerDay - introduced))
        .toArray(),
    ]);
    picked = order<{ word: VocabDoc; isNew: boolean }>(
      due.map((word) => ({ word, isNew: false })),
      fresh.map((word) => ({ word, isNew: true })),
      settings.order
    );
  } else {
    const filter: Record<string, unknown> = { ...scope };
    if (input.filter === "tag" && input.tag) filter.tags = input.tag;
    if (input.filter === "failed_today") {
      const failed = await reviewLogs.distinct("vocabId", { userId: user._id, rating: "again", reviewedAt: { $gte: day.start } });
      filter._id = { $in: failed };
    }
    const words = await vocab.find(filter).sort({ "srs.due": 1 }).limit(input.limit ?? 20).toArray();
    picked = words.map((word) => ({ word, isNew: word.srs.state === "NEW" }));
  }
  picked = picked.slice(0, input.limit ?? picked.length);

  const session: SessionDoc = {
    _id: new ObjectId(),
    userId: user._id,
    deckId: deck._id,
    includeSubdecks: input.includeSubdecks,
    mode: input.mode,
    rescheduleMode,
    // Snapshot: changing deck settings later never affects this session (AC-12).
    steps: input.steps ?? settings.steps,
    settings,
    items: picked.map(({ word, isNew }) => ({ vocabId: word._id, results: [], status: "pending", isNew })),
    status: "active",
    startedAt: now,
    finishedAt: null,
  };
  await sessions.insertOne(session);
  return session;
}

function order<T>(due: T[], fresh: T[], mode: DeckSettings["order"]) {
  if (mode === "NEW_FIRST") return [...fresh, ...due];
  if (mode === "REVIEW_FIRST") return [...due, ...fresh];
  // MIX: spread new words evenly between reviews.
  const out: T[] = [];
  const step = fresh.length ? Math.max(1, Math.floor(due.length / fresh.length)) : Infinity;
  let r = 0;
  for (const n of fresh) {
    out.push(...due.slice(r, r + step), n);
    r += step;
  }
  return [...out, ...due.slice(r)];
}

export async function getOwnedSession(userId: ObjectId, sessionId: string) {
  const { sessions } = await collections();
  const s = await sessions.findOne({ _id: new ObjectId(parseId(sessionId)), userId });
  if (!s) throw notFound("Không tìm thấy buổi học");
  return s;
}

export const submitStepInput = z.object({
  itemIndex: z.number().int().min(0),
  step: z.enum(["FLASHCARD", "MEANING_TO_WORD", "AUDIO_TO_WORD"]),
  selfRating: z.enum(["again", "hard", "good", "easy"]).optional(),
  input: z.string().max(300).optional(),
  hintsUsed: z.number().int().min(0).max(10).optional(),
  revealed: z.boolean().optional(),
  /** Listening step could not play audio: leave the word unscored (AC-07). */
  audioUnavailable: z.boolean().optional(),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
});

export type StepOutcome = {
  correct?: boolean;
  evaluation: AttemptEvaluation | { status: "skipped" };
  /** Revealed only after the learner has answered. */
  answer: { term: string; acceptedAnswers: string[]; phonetic?: string } | null;
};

export async function submitStep(user: Learner, sessionId: string, raw: z.input<typeof submitStepInput>, now = new Date()): Promise<StepOutcome> {
  const input = submitStepInput.parse(raw);
  const session = await getOwnedSession(user._id, sessionId);
  const item = session.items[input.itemIndex];
  if (!item) throw notFound("Không tìm thấy từ trong buổi học");
  const { vocab, sessions } = await collections();
  const word = await vocab.findOne({ _id: item.vocabId, ownerId: user._id });
  if (!word) throw notFound("Từ đã bị xoá");
  const answer = { term: word.term, acceptedAnswers: word.acceptedAnswers, phonetic: word.phonetic };

  // Retried request for an attempt that already finished: answer with the stored outcome, change nothing (AC-10).
  if (item.status !== "pending") {
    const evaluation = item.status === "skipped" ? { status: "skipped" as const } : evaluateAttempt(session.steps, item.results);
    return { evaluation, answer, correct: item.results.find((r) => r.step === input.step)?.correct };
  }
  if (session.status !== "active") throw conflict("Buổi học đã kết thúc");

  const progress = evaluateAttempt(session.steps, item.results);
  if (progress.status !== "in_progress" || progress.nextStep !== input.step) {
    const done = item.results.find((r) => r.step === input.step);
    if (done) return { evaluation: progress, answer, correct: done.correct };
    throw conflict("Bước học không khớp");
  }

  const itemPath = `items.${input.itemIndex}`;
  const guard = { _id: session._id, [`${itemPath}.status`]: "pending", [`${itemPath}.results`]: { $size: item.results.length } };

  if (input.audioUnavailable && input.step === "AUDIO_TO_WORD") {
    const r = await sessions.updateOne(guard, { $set: { [`${itemPath}.status`]: "skipped", [`${itemPath}.completedAt`]: now } });
    if (!r.modifiedCount) throw conflict("Bước này vừa được ghi ở nơi khác");
    return { evaluation: { status: "skipped" }, answer };
  }

  let result: StepResult & { input?: string; at: Date };
  if (input.step === "FLASHCARD") {
    if (!input.selfRating) throw new AppError(400, "Thiếu mức nhớ");
    result = { step: "FLASHCARD", selfRating: input.selfRating, at: now };
  } else {
    const revealed = input.revealed ?? false;
    const correct = !revealed && checkAnswer(input.input ?? "", word.acceptedAnswers, {
      caseSensitive: session.settings.caseSensitive,
      locale: word.languageCode,
    }).correct;
    result = { step: input.step, correct, revealed, hintsUsed: input.hintsUsed ?? 0, input: input.input, at: now };
  }
  const results = [...item.results, result];
  const evaluation = evaluateAttempt(session.steps, results);

  if (evaluation.status === "in_progress") {
    const r = await sessions.updateOne(guard, { $push: { [`${itemPath}.results`]: result } });
    if (!r.modifiedCount) throw conflict("Bước này vừa được ghi ở nơi khác");
  } else {
    await finalizeAttempt(session, input.itemIndex, results, evaluation.rating, word, now);
  }
  return { evaluation, answer: input.step === "FLASHCARD" && evaluation.status === "in_progress" ? null : answer, correct: result.correct };
}

/** One FSRS update + one review log per attempt, atomically (spec 11.2 step 4). */
async function finalizeAttempt(
  session: SessionDoc,
  itemIndex: number,
  results: SessionItem["results"],
  rating: NonNullable<SessionItem["rating"]>,
  word: VocabDoc,
  now: Date
) {
  const { vocab, sessions, reviewLogs } = await collections();
  const itemPath = `items.${itemIndex}`;
  const item = session.items[itemIndex];
  const scheduled = session.rescheduleMode === "scheduled";
  const next = scheduled ? schedule(word.srs, rating, now, session.settings) : null;
  const tries = session.items.filter((i) => i.vocabId.equals(word._id)).length;
  const requeue: SessionItem | null =
    rating === "again" && tries < MAX_TRIES_PER_SESSION ? { vocabId: word._id, results: [], status: "pending", isNew: false } : null;

  const log: ReviewLogDoc = {
    _id: new ObjectId(),
    userId: session.userId,
    vocabId: word._id,
    sessionId: session._id,
    attemptKey: `${session._id.toHexString()}:${itemIndex}`,
    rating,
    rescheduleMode: session.rescheduleMode,
    previous: scheduled ? word.srs : null,
    next,
    reviewedAt: now,
    algorithm: ALGORITHM,
  };

  const client = await getClient();
  await client.withSession((s: ClientSession) =>
    s.withTransaction(async () => {
      const r = await sessions.updateOne(
        { _id: session._id, [`${itemPath}.status`]: "pending", [`${itemPath}.results`]: { $size: item.results.length } },
        {
          $set: { [`${itemPath}.results`]: results, [`${itemPath}.rating`]: rating, [`${itemPath}.status`]: "done", [`${itemPath}.completedAt`]: now },
        },
        { session: s }
      );
      if (!r.modifiedCount) throw conflict("Lượt học này đã được ghi");
      if (requeue) await sessions.updateOne({ _id: session._id }, { $push: { items: requeue } }, { session: s });
      await reviewLogs.insertOne(log, { session: s });
      if (next) {
        // Optimistic lock: a second tab reviewing the same word from the same revision loses.
        const v = await vocab.updateOne({ _id: word._id, "srs.revision": word.srs.revision }, { $set: { srs: next } }, { session: s });
        if (!v.modifiedCount) throw conflict("Từ này vừa được ôn ở nơi khác");
      }
    })
  );
}

export async function finishSession(userId: ObjectId, sessionId: string, now = new Date()) {
  const session = await getOwnedSession(userId, sessionId);
  const { sessions } = await collections();
  if (session.status === "active") await sessions.updateOne({ _id: session._id }, { $set: { status: "finished", finishedAt: now } });
  return summarize({ ...session, status: "finished" });
}

export function summarize(session: SessionDoc) {
  const done = session.items.filter((i) => i.status === "done");
  const words = new Set(session.items.map((i) => i.vocabId.toHexString()));
  const finishedWords = new Set(
    session.items.filter((i) => i.status !== "pending").map((i) => i.vocabId.toHexString())
  );
  const firstTry = new Map<string, SessionItem>();
  for (const i of done) if (!firstTry.has(i.vocabId.toHexString())) firstTry.set(i.vocabId.toHexString(), i);
  const remembered = [...firstTry.values()].filter((i) => i.rating !== "again").length;
  const ms = (session.finishedAt ?? new Date()).getTime() - session.startedAt.getTime();
  return {
    totalWords: words.size,
    finishedWords: finishedWords.size,
    remembered,
    forgotten: firstTry.size - remembered,
    newWords: new Set(session.items.filter((i) => i.isNew).map((i) => i.vocabId.toHexString())).size,
    // XP per finished word, never per step, hint or replay (spec 13.1).
    xp: finishedWords.size * 10,
    minutes: Math.max(1, Math.round(ms / 60_000)),
    rescheduleMode: session.rescheduleMode,
  };
}
