import { createEmptyCard, fsrs, FSRSVersion, generatorParameters, Rating as FsrsRating, State, type Card, type StepUnit } from "ts-fsrs";
import type { Rating } from "@/features/study/attempt";
import type { DeckSettings, SrsState } from "@/lib/types";

export const ALGORITHM = `ts-fsrs@${FSRSVersion}`;

const STATE_NAMES = {
  [State.New]: "NEW",
  [State.Learning]: "LEARNING",
  [State.Review]: "REVIEW",
  [State.Relearning]: "RELEARNING",
} as const;

const GRADES = { again: FsrsRating.Again, hard: FsrsRating.Hard, good: FsrsRating.Good, easy: FsrsRating.Easy } as const;

function toSrs(card: Card, revision: number, introducedAt: Date | null): SrsState {
  return { card: { ...card }, due: card.due, state: STATE_NAMES[card.state], revision, introducedAt };
}

export function newSrs(now: Date): SrsState {
  return toSrs(createEmptyCard(now), 0, null);
}

export function schedule(srs: SrsState, rating: Rating, now: Date, settings: DeckSettings): SrsState {
  const scheduler = fsrs(
    generatorParameters({
      request_retention: settings.desiredRetention,
      maximum_interval: settings.maximumInterval,
      learning_steps: settings.learningSteps as StepUnit[],
      relearning_steps: settings.relearningSteps as StepUnit[],
      // Fuzz makes intervals non-deterministic; keep results reproducible from review logs.
      enable_fuzz: false,
    })
  );
  const { card } = scheduler.next(srs.card as Card, now, GRADES[rating]);
  // ts-fsrs keeps Hard < Good < Easy by +1 day even past maximum_interval; the preset cap is a hard limit.
  if (card.scheduled_days > settings.maximumInterval) {
    card.scheduled_days = settings.maximumInterval;
    card.due = new Date(now.getTime() + settings.maximumInterval * 86_400_000);
  }
  return toSrs(card, srs.revision + 1, srs.introducedAt ?? now);
}
