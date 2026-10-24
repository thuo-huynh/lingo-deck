import { describe, expect, it } from "vitest";
import { evaluateAttempt, type StepResult } from "./attempt";

const ALL = ["FLASHCARD", "MEANING_TO_WORD", "AUDIO_TO_WORD"] as const;
const flash = (selfRating: "again" | "hard" | "good" | "easy"): StepResult => ({ step: "FLASHCARD", selfRating });
const typed = (step: "MEANING_TO_WORD" | "AUDIO_TO_WORD", correct: boolean, extra: Partial<StepResult> = {}): StepResult => ({
  step,
  correct,
  ...extra,
});

describe("evaluateAttempt", () => {
  it("asks for the first selected step when nothing is answered", () => {
    expect(evaluateAttempt([...ALL], [])).toEqual({ status: "in_progress", nextStep: "FLASHCARD" });
  });

  it("moves to the next selected step after a pass", () => {
    expect(evaluateAttempt([...ALL], [flash("good")])).toEqual({ status: "in_progress", nextStep: "MEANING_TO_WORD" });
  });

  it("rates Good when all three steps pass first time without hints (AC-02)", () => {
    const r = evaluateAttempt([...ALL], [flash("good"), typed("MEANING_TO_WORD", true), typed("AUDIO_TO_WORD", true)]);
    expect(r).toEqual({ status: "done", rating: "good" });
  });

  it("ends the attempt with Again when flashcard is Again", () => {
    expect(evaluateAttempt([...ALL], [flash("again")])).toEqual({ status: "done", rating: "again" });
  });

  it("fails the attempt and skips later steps when step 2 is wrong (AC-03)", () => {
    const r = evaluateAttempt([...ALL], [flash("easy"), typed("MEANING_TO_WORD", false)]);
    expect(r).toEqual({ status: "done", rating: "again" });
  });

  it("caps the rating at Hard when a typing hint was used (AC-04)", () => {
    const r = evaluateAttempt([...ALL], [
      flash("easy"),
      typed("MEANING_TO_WORD", true, { hintsUsed: 1 }),
      typed("AUDIO_TO_WORD", true),
    ]);
    expect(r).toEqual({ status: "done", rating: "hard" });
  });

  it("rates Again when the answer was revealed, even if then typed correctly (AC-05)", () => {
    const r = evaluateAttempt(["MEANING_TO_WORD"], [typed("MEANING_TO_WORD", true, { revealed: true })]);
    expect(r).toEqual({ status: "done", rating: "again" });
  });

  it("rates Hard when the flashcard was Hard and typing passed", () => {
    const r = evaluateAttempt(["FLASHCARD", "MEANING_TO_WORD"], [flash("hard"), typed("MEANING_TO_WORD", true)]);
    expect(r).toEqual({ status: "done", rating: "hard" });
  });

  it("rates Easy only when the flashcard was Easy and every step passed cleanly", () => {
    const r = evaluateAttempt([...ALL], [flash("easy"), typed("MEANING_TO_WORD", true), typed("AUDIO_TO_WORD", true)]);
    expect(r).toEqual({ status: "done", rating: "easy" });
  });

  it("never rewards Easy for typing alone", () => {
    const r = evaluateAttempt(["AUDIO_TO_WORD"], [typed("AUDIO_TO_WORD", true)]);
    expect(r).toEqual({ status: "done", rating: "good" });
  });

  it("uses the flashcard self-rating directly when flashcard is the only step", () => {
    expect(evaluateAttempt(["FLASHCARD"], [flash("hard")])).toEqual({ status: "done", rating: "hard" });
  });

  it("rejects results that do not match the selected step order", () => {
    expect(() => evaluateAttempt(["FLASHCARD"], [typed("MEANING_TO_WORD", true)])).toThrow();
  });
});
