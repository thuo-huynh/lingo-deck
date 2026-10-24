import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { setupTestMongo } from "@/test/mongo";
import { collections } from "@/lib/db";
import type { UserDoc } from "@/lib/types";
import { createDeck } from "@/features/decks/service";
import { createVocab } from "@/features/vocab/service";
import { dashboard, stepAccuracy } from "./service";
import { createSession, submitStep } from "@/features/study/session";

setupTestMongo();

const user: UserDoc = {
  _id: new ObjectId(),
  email: "a@b.c",
  timezone: "Asia/Ho_Chi_Minh",
  dayStartHour: 4,
  dailyGoal: 10,
  onboarded: true,
  createdAt: new Date(),
};
const now = new Date("2026-10-24T05:00:00Z"); // 12:00 local

async function logAt(iso: string, vocabId = new ObjectId()) {
  const { reviewLogs } = await collections();
  await reviewLogs.insertOne({
    _id: new ObjectId(), userId: user._id, vocabId, sessionId: new ObjectId(), attemptKey: new ObjectId().toHexString(),
    rating: "good", rescheduleMode: "scheduled", previous: null, next: null, reviewedAt: new Date(iso), algorithm: "test",
  });
}

describe("dashboard", () => {
  it("counts consecutive study days, tolerating today not studied yet", async () => {
    await logAt("2026-10-23T05:00:00Z");
    await logAt("2026-10-22T05:00:00Z");
    await logAt("2026-10-20T05:00:00Z");
    expect((await dashboard(user, [], now)).streak).toBe(2);
    await logAt("2026-10-24T04:00:00Z");
    expect((await dashboard(user, [], now)).streak).toBe(3);
  });

  it("treats 02:00 local as the previous study day when the day starts at 04:00", async () => {
    await logAt("2026-10-23T19:00:00Z"); // 02:00 local on the 24th → study day 23rd
    const d = await dashboard(user, [], now);
    expect(d.streak).toBe(1);
    expect(d.wordsToday).toBe(0);
  });

  it("totals new words across root decks without double-counting subdecks", async () => {
    const root = await createDeck(user._id, { name: "English" }, now);
    const child = await createDeck(user._id, { name: "A1", parentId: root._id.toHexString() }, now);
    await createVocab(user._id, { deckId: root._id.toHexString(), term: "a", meaningVi: "a" }, now);
    await createVocab(user._id, { deckId: child._id.toHexString(), term: "b", meaningVi: "b" }, now);
    const { decks } = await collections();
    const d = await dashboard(user, await decks.find().toArray(), now);
    expect(d.new).toBe(2);
    expect(d.counts(child._id).new).toBe(1);
  });
});

describe("stepAccuracy", () => {
  it("reports first-try accuracy per step from answered steps", async () => {
    const deck = await createDeck(user._id, { name: "S" }, now);
    await createVocab(user._id, { deckId: deck._id.toHexString(), term: "cat", meaningVi: "mèo" }, now);
    await createVocab(user._id, { deckId: deck._id.toHexString(), term: "dog", meaningVi: "chó" }, now);
    const s = await createSession(user, { deckId: deck._id.toHexString(), steps: ["FLASHCARD", "MEANING_TO_WORD"] }, now);
    const id = s._id.toHexString();
    await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "good" }, now);
    await submitStep(user, id, { itemIndex: 0, step: "MEANING_TO_WORD", input: "cat" }, now);
    await submitStep(user, id, { itemIndex: 1, step: "FLASHCARD", selfRating: "again" }, now);

    const acc = await stepAccuracy(user._id);
    expect(acc).toEqual({
      FLASHCARD: { total: 2, correct: 1 },
      MEANING_TO_WORD: { total: 1, correct: 1 },
      AUDIO_TO_WORD: { total: 0, correct: 0 },
    });
  });
});
