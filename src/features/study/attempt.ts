export const STEP_TYPES = ["FLASHCARD", "MEANING_TO_WORD", "AUDIO_TO_WORD"] as const;
export type StepType = (typeof STEP_TYPES)[number];
export type Rating = "again" | "hard" | "good" | "easy";

export type StepResult = {
  step: StepType;
  selfRating?: Rating;
  correct?: boolean;
  hintsUsed?: number;
  revealed?: boolean;
};

export type AttemptEvaluation =
  | { status: "in_progress"; nextStep: StepType }
  | { status: "done"; rating: Rating };

const failed = (r: StepResult) =>
  r.step === "FLASHCARD" ? r.selfRating === "again" : r.revealed === true || r.correct !== true;

// Spec 4.4: steps gate one attempt; the scheduler gets exactly one rating per attempt.
export function evaluateAttempt(steps: StepType[], results: StepResult[]): AttemptEvaluation {
  results.forEach((r, i) => {
    if (r.step !== steps[i]) throw new Error(`Result ${i} is ${r.step}, expected ${steps[i]}`);
  });
  if (results.some(failed)) return { status: "done", rating: "again" };
  if (results.length < steps.length) return { status: "in_progress", nextStep: steps[results.length] };

  const flashRating = results.find((r) => r.step === "FLASHCARD")?.selfRating;
  const usedHint = results.some((r) => (r.hintsUsed ?? 0) > 0);
  if (usedHint || flashRating === "hard") return { status: "done", rating: "hard" };
  return { status: "done", rating: flashRating === "easy" ? "easy" : "good" };
}
