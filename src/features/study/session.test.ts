import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { setupTestMongo } from "@/test/mongo";
import { collections } from "@/lib/db";
import { createDeck } from "@/features/decks/service";
import { createVocab } from "@/features/vocab/service";
import { createSession, finishSession, submitStep } from "./session";
import { updateDeckSettings } from "@/features/decks/service";
import { DEFAULT_SETTINGS } from "@/features/decks/settings";

setupTestMongo();

const now = new Date("2026-10-24T03:00:00Z");
const user = { _id: new ObjectId(), timezone: "Asia/Ho_Chi_Minh", dayStartHour: 4 };

async function word(deckId: ObjectId, term: string) {
  return createVocab(user._id, { deckId: deckId.toHexString(), term, meaningVi: `nghĩa ${term}` }, now);
}

describe("createSession queue", () => {
  it("includes words from the deck and all its subdecks, once each (AC-08)", async () => {
    const root = await createDeck(user._id, { name: "English" }, now);
    const child = await createDeck(user._id, { name: "A1", parentId: root._id.toHexString() }, now);
    const grandchild = await createDeck(user._id, { name: "Food", parentId: child._id.toHexString() }, now);
    await word(root._id, "hello");
    await word(child._id, "cat");
    await word(grandchild._id, "apple");

    const s = await createSession(user, { deckId: root._id.toHexString(), includeSubdecks: true }, now);
    expect(s.items).toHaveLength(3);
    expect(new Set(s.items.map((i) => i.vocabId.toHexString())).size).toBe(3);

    const onlyChild = await createSession(user, { deckId: child._id.toHexString(), includeSubdecks: false }, now);
    expect(onlyChild.items).toHaveLength(1);
  });

  it("respects the new-words-per-day quota", async () => {
    const deck = await createDeck(user._id, { name: "Big" }, now);
    for (let i = 0; i < 15; i++) await word(deck._id, `w${i}`);
    const s = await createSession(user, { deckId: deck._id.toHexString(), includeSubdecks: true }, now);
    expect(s.items).toHaveLength(10);
  });

  it("never queues suspended words (AC-14)", async () => {
    const deck = await createDeck(user._id, { name: "D" }, now);
    const w = await word(deck._id, "gone");
    await word(deck._id, "here");
    const { vocab } = await collections();
    await vocab.updateOne({ _id: w._id }, { $set: { status: "suspended" } });
    const s = await createSession(user, { deckId: deck._id.toHexString(), includeSubdecks: true }, now);
    expect(s.items.map((i) => i.vocabId.toHexString())).toEqual([expect.not.stringMatching(w._id.toHexString())]);
  });

  it("does not let another user study my deck (AC-13)", async () => {
    const deck = await createDeck(user._id, { name: "Private" }, now);
    await word(deck._id, "secret");
    const stranger = { ...user, _id: new ObjectId() };
    await expect(createSession(stranger, { deckId: deck._id.toHexString(), includeSubdecks: true }, now)).rejects.toThrow();
  });
});

async function oneWordSession(opts: Parameters<typeof createSession>[1] extends infer T ? Partial<T & object> : never = {}) {
  const deck = await createDeck(user._id, { name: "D" }, now);
  const w = await word(deck._id, "apple");
  const s = await createSession(user, { deckId: deck._id.toHexString(), includeSubdecks: true, ...opts }, now);
  return { deck, w, s, id: s._id.toHexString() };
}

describe("submitStep", () => {
  it("passing all three steps writes exactly one review log and one schedule change (AC-02)", async () => {
    const { w, id } = await oneWordSession();
    await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "good" }, now);
    await submitStep(user, id, { itemIndex: 0, step: "MEANING_TO_WORD", input: "Apple " }, now);
    const out = await submitStep(user, id, { itemIndex: 0, step: "AUDIO_TO_WORD", input: "apple" }, now);
    expect(out.evaluation).toEqual({ status: "done", rating: "good" });

    const { reviewLogs, vocab } = await collections();
    expect(await reviewLogs.countDocuments({ vocabId: w._id })).toBe(1);
    const after = await vocab.findOne({ _id: w._id });
    expect(after!.srs.revision).toBe(1);
    expect(after!.srs.state).toBe("LEARNING");
  });

  it("a wrong answer at step 2 rates Again and re-queues the word (AC-03)", async () => {
    const { id } = await oneWordSession();
    await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "easy" }, now);
    const out = await submitStep(user, id, { itemIndex: 0, step: "MEANING_TO_WORD", input: "aple" }, now);
    expect(out).toMatchObject({ correct: false, evaluation: { status: "done", rating: "again" }, answer: { term: "apple" } });
    await expect(submitStep(user, id, { itemIndex: 0, step: "AUDIO_TO_WORD", input: "apple" }, now)).resolves.toMatchObject({
      evaluation: { rating: "again" },
    });
    const { sessions } = await collections();
    const s = await sessions.findOne({ _id: new ObjectId(id) });
    expect(s!.items).toHaveLength(2);
    expect(s!.items[1].status).toBe("pending");
  });

  it("submitting the same final step twice never doubles the review (AC-10)", async () => {
    const { w, id } = await oneWordSession({ steps: ["FLASHCARD"] });
    const a = await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "good" }, now);
    const b = await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "easy" }, now);
    expect(b.evaluation).toEqual(a.evaluation);
    const { reviewLogs, vocab } = await collections();
    expect(await reviewLogs.countDocuments({ vocabId: w._id })).toBe(1);
    expect((await vocab.findOne({ _id: w._id }))!.srs.revision).toBe(1);
  });

  it("practice-only sessions never change the schedule (AC-09)", async () => {
    const { w, id } = await oneWordSession({ mode: "CUSTOM", filter: "all", steps: ["FLASHCARD"] });
    await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "again" }, now);
    const { vocab } = await collections();
    const after = await vocab.findOne({ _id: w._id });
    expect(after!.srs).toEqual(w.srs);
  });

  it("broken audio skips the word without scoring it (AC-07)", async () => {
    const { w, id } = await oneWordSession({ steps: ["AUDIO_TO_WORD"] });
    const out = await submitStep(user, id, { itemIndex: 0, step: "AUDIO_TO_WORD", audioUnavailable: true }, now);
    expect(out.evaluation).toEqual({ status: "skipped" });
    const { vocab, reviewLogs } = await collections();
    expect((await vocab.findOne({ _id: w._id }))!.srs).toEqual(w.srs);
    expect(await reviewLogs.countDocuments({})).toBe(0);
  });

  it("keeps the step snapshot when deck settings change mid-session (AC-12)", async () => {
    const { deck, id } = await oneWordSession();
    await updateDeckSettings(user._id, deck._id.toHexString(), { ...DEFAULT_SETTINGS, steps: ["FLASHCARD"] });
    const out = await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "good" }, now);
    expect(out.evaluation).toEqual({ status: "in_progress", nextStep: "MEANING_TO_WORD" });
  });

  it("does not reveal the answer after a passed flashcard when typing steps remain", async () => {
    const { id } = await oneWordSession();
    const out = await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "good" }, now);
    expect(out.answer).toBeNull();
  });

  it("summarizes unique words, not steps", async () => {
    const { id } = await oneWordSession();
    await submitStep(user, id, { itemIndex: 0, step: "FLASHCARD", selfRating: "again" }, now);
    const sum = await finishSession(user._id, id, now);
    expect(sum).toMatchObject({ totalWords: 1, finishedWords: 1, forgotten: 1, remembered: 0, xp: 10 });
  });
});
