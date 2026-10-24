import "server-only";
import type { ObjectId } from "mongodb";
import { collections } from "@/lib/db";
import { studyDay } from "@/lib/day";
import type { DeckDoc, UserDoc } from "@/lib/types";

export type DeckCounts = { total: number; new: number; due: number; learning: number };
const empty = (): DeckCounts => ({ total: 0, new: 0, due: 0, learning: 0 });

/**
 * Counts per deck, each including its subdecks. A word has exactly one home deck,
 * so counting it once per ancestor never double-counts within a deck (spec 3.1).
 */
export async function deckCounts(user: Pick<UserDoc, "_id" | "timezone" | "dayStartHour">, now = new Date()) {
  const { vocab } = await collections();
  const day = studyDay(now, user.timezone, user.dayStartHour);
  const rows = await vocab
    .aggregate<{ _id: ObjectId } & DeckCounts>([
      { $match: { ownerId: user._id, status: "active" } },
      { $unwind: "$deckPath" },
      {
        $group: {
          _id: "$deckPath",
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ["$srs.state", "NEW"] }, 1, 0] } },
          // Same rule as the daily queue (study/session.ts dueFilter).
          due: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $and: [{ $eq: ["$srs.state", "REVIEW"] }, { $lt: ["$srs.due", day.end] }] },
                    { $and: [{ $in: ["$srs.state", ["LEARNING", "RELEARNING"]] }, { $lte: ["$srs.due", now] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          learning: { $sum: { $cond: [{ $in: ["$srs.state", ["LEARNING", "RELEARNING"]] }, 1, 0] } },
        },
      },
    ])
    .toArray();
  const map = new Map<string, DeckCounts>();
  for (const { _id, ...c } of rows) map.set(_id.toHexString(), c);
  return (deckId: ObjectId) => map.get(deckId.toHexString()) ?? empty();
}

/** Study-day keys (YYYY-MM-DD in the learner's day) on which at least one attempt finished. */
async function studyDays(user: Pick<UserDoc, "_id" | "timezone" | "dayStartHour">, since: Date) {
  const { reviewLogs } = await collections();
  const rows = await reviewLogs
    .aggregate<{ _id: string }>([
      { $match: { userId: user._id, reviewedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              timezone: user.timezone,
              date: { $subtract: ["$reviewedAt", user.dayStartHour * 3_600_000] },
            },
          },
        },
      },
    ])
    .toArray();
  return new Set(rows.map((r) => r._id));
}

export async function dashboard(user: UserDoc, decks: DeckDoc[], now = new Date()) {
  const { reviewLogs, vocab } = await collections();
  const day = studyDay(now, user.timezone, user.dayStartHour);
  const counts = await deckCounts(user, now);
  const roots = decks.filter((d) => !d.parentId);
  const totals = roots.reduce((acc, d) => {
    const c = counts(d._id);
    return { new: acc.new + c.new, due: acc.due + c.due, learning: acc.learning + c.learning };
  }, { new: 0, due: 0, learning: 0 });

  // Daily goal counts unique words finished today, not steps (spec 4.4, 13.1).
  const [wordsToday, introducedToday] = await Promise.all([
    reviewLogs.distinct("vocabId", { userId: user._id, reviewedAt: { $gte: day.start } }).then((a) => a.length),
    vocab.countDocuments({ ownerId: user._id, "srs.introducedAt": { $gte: day.start } }),
  ]);

  const days = await studyDays(user, new Date(now.getTime() - 400 * 86_400_000));
  let streak = 0;
  // Today not studied yet does not break the streak.
  let cursor = days.has(day.key) ? day.start : new Date(day.start.getTime() - 1);
  for (;;) {
    const d = studyDay(cursor, user.timezone, user.dayStartHour);
    if (!days.has(d.key)) break;
    streak++;
    cursor = new Date(d.start.getTime() - 1);
  }

  return { ...totals, wordsToday, introducedToday, streak, counts };
}

export async function history(user: UserDoc, now = new Date(), days = 14) {
  const { reviewLogs, vocab } = await collections();
  const today = studyDay(now, user.timezone, user.dayStartHour);
  const since = new Date(today.start.getTime() - (days - 1) * 86_400_000 - 3_600_000);
  const rows = await reviewLogs
    .aggregate<{ _id: string; words: number }>([
      { $match: { userId: user._id, reviewedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", timezone: user.timezone, date: { $subtract: ["$reviewedAt", user.dayStartHour * 3_600_000] } } },
          ids: { $addToSet: "$vocabId" },
        },
      },
      { $project: { words: { $size: "$ids" } } },
    ])
    .toArray();
  const byDay = new Map(rows.map((r) => [r._id, r.words]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = studyDay(new Date(today.start.getTime() - (days - 1 - i) * 86_400_000 + 3_600_000), user.timezone, user.dayStartHour);
    return { day: d.key, words: byDay.get(d.key) ?? 0 };
  });

  // Retention: share of scheduled reviews of already-learned words that were not forgotten (spec 13.2).
  const [ret] = await reviewLogs
    .aggregate<{ total: number; kept: number }>([
      { $match: { userId: user._id, rescheduleMode: "scheduled", "previous.state": "REVIEW", reviewedAt: { $gte: new Date(now.getTime() - 30 * 86_400_000) } } },
      { $group: { _id: null, total: { $sum: 1 }, kept: { $sum: { $cond: [{ $ne: ["$rating", "again"] }, 1, 0] } } } },
    ])
    .toArray();
  const [totalWords, matureWords] = await Promise.all([
    vocab.countDocuments({ ownerId: user._id, status: "active" }),
    vocab.countDocuments({ ownerId: user._id, status: "active", "srs.state": "REVIEW" }),
  ]);
  return { series, retention: ret?.total ? ret.kept / ret.total : null, retentionSample: ret?.total ?? 0, totalWords, matureWords };
}
