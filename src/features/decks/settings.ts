import { z } from "zod";
import { STEP_TYPES } from "@/features/study/attempt";
import type { DeckSettings } from "@/lib/types";

// Product defaults from spec 5.3 / 10.3.
export const DEFAULT_SETTINGS: DeckSettings = {
  newPerDay: 10,
  maxReviewsPerDay: 100,
  steps: ["FLASHCARD", "MEANING_TO_WORD", "AUDIO_TO_WORD"],
  order: "REVIEW_FIRST",
  showPhonetic: true,
  allowHints: true,
  audioAutoplay: true,
  caseSensitive: false,
  desiredRetention: 0.9,
  learningSteps: ["1m", "10m"],
  relearningSteps: ["10m"],
  maximumInterval: 36500,
};

const stepUnit = z.string().regex(/^\d+(m|h|d)$/);

export const stepsSchema = z
  .array(z.enum(STEP_TYPES))
  .min(1)
  .max(3)
  .refine((s) => new Set(s).size === s.length, "Các bước không được trùng");

export const settingsSchema = z.object({
  newPerDay: z.number().int().min(0).max(9999),
  maxReviewsPerDay: z.number().int().min(0).max(9999),
  steps: stepsSchema,
  order: z.enum(["REVIEW_FIRST", "NEW_FIRST", "MIX"]),
  showPhonetic: z.boolean(),
  allowHints: z.boolean(),
  audioAutoplay: z.boolean(),
  caseSensitive: z.boolean(),
  desiredRetention: z.number().min(0.7).max(0.99),
  learningSteps: z.array(stepUnit).max(10),
  relearningSteps: z.array(stepUnit).max(10),
  maximumInterval: z.number().int().min(1).max(36500),
}) satisfies z.ZodType<DeckSettings>;

/** Walks from the deck up to the root and returns the first explicit settings. */
export function resolveSettings(chain: { settings: DeckSettings | null }[]): DeckSettings {
  return chain.find((d) => d.settings)?.settings ?? DEFAULT_SETTINGS;
}
