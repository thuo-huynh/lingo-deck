import type { ObjectId } from "mongodb";
import type { Rating, StepResult, StepType } from "@/features/study/attempt";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  displayName?: string;
  timezone: string;
  dayStartHour: number;
  dailyGoal: number;
  onboarded: boolean;
  /** Preset "Mặc định": used by every deck chain without its own settings. */
  defaultSettings?: DeckSettings;
  createdAt: Date;
};

export type OtpDoc = { _id: ObjectId; email: string; ip: string; codeHash: string; expiresAt: Date; tries: number };

export type DeckSettings = {
  newPerDay: number;
  maxReviewsPerDay: number;
  steps: StepType[];
  order: "REVIEW_FIRST" | "NEW_FIRST" | "MIX";
  showPhonetic: boolean;
  allowHints: boolean;
  audioAutoplay: boolean;
  caseSensitive: boolean;
  desiredRetention: number;
  learningSteps: string[];
  relearningSteps: string[];
  maximumInterval: number;
};

export type DeckDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  parentId: ObjectId | null;
  /** ancestors + self, root first: lets one query select a deck and all its subdecks */
  path: ObjectId[];
  name: string;
  description?: string;
  color: string;
  sortOrder: number;
  /** null = inherit from parent (root falls back to defaults) */
  settings: DeckSettings | null;
  archivedAt: Date | null;
  createdAt: Date;
};

export type Example = { text: string; translationVi?: string };
export type Hint = { type: "first_letter" | "letter_count" | "custom"; value: string };

export type SrsState = {
  /** ts-fsrs Card, dates as Date */
  card: {
    due: Date;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    learning_steps: number;
    reps: number;
    lapses: number;
    state: number;
    last_review?: Date;
  };
  due: Date;
  state: "NEW" | "LEARNING" | "REVIEW" | "RELEARNING";
  revision: number;
  introducedAt: Date | null;
};

export type VocabDoc = {
  _id: ObjectId;
  ownerId: ObjectId;
  deckId: ObjectId;
  deckPath: ObjectId[];
  languageCode: string;
  term: string;
  meaningVi: string;
  acceptedAnswers: string[];
  partOfSpeech?: string;
  phonetic?: string;
  examples: Example[];
  hints: Hint[];
  tags: string[];
  notes?: string;
  audioKey?: string;
  imageKey?: string;
  status: "active" | "suspended" | "archived";
  srs: SrsState;
  createdAt: Date;
  updatedAt: Date;
};

/** One item = one attempt at a word. A failed word is re-queued as a new item later in the session. */
export type SessionItem = {
  vocabId: ObjectId;
  results: (StepResult & { input?: string; at: Date })[];
  rating?: Rating;
  status: "pending" | "done" | "skipped";
  isNew: boolean;
  completedAt?: Date;
};

export type SessionDoc = {
  _id: ObjectId;
  userId: ObjectId;
  deckId: ObjectId;
  includeSubdecks: boolean;
  mode: "DAILY" | "CUSTOM";
  rescheduleMode: "scheduled" | "practice_only";
  steps: StepType[];
  settings: DeckSettings;
  items: SessionItem[];
  status: "active" | "finished";
  startedAt: Date;
  finishedAt: Date | null;
};

export type ReviewLogDoc = {
  _id: ObjectId;
  userId: ObjectId;
  vocabId: ObjectId;
  sessionId: ObjectId;
  /** `${sessionId}:${itemIndex}:${attemptIndex}` — unique, so a finalize can never be applied twice */
  attemptKey: string;
  rating: Rating;
  rescheduleMode: SessionDoc["rescheduleMode"];
  previous: SrsState | null;
  next: SrsState | null;
  reviewedAt: Date;
  algorithm: string;
};
