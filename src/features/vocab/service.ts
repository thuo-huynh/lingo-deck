import "server-only";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { collections } from "@/lib/db";
import { notFound, parseId } from "@/lib/errors";
import type { VocabDoc } from "@/lib/types";
import { getOwnedDeck } from "@/features/decks/service";
import { newSrs } from "@/features/scheduling/fsrs";

const text = (max: number) => z.string().trim().max(max);

export const vocabInput = z.object({
  deckId: z.string(),
  term: text(200).min(1, "Nhập từ"),
  meaningVi: text(500).min(1, "Nhập nghĩa tiếng Việt"),
  languageCode: z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/).default("en-US"),
  acceptedAnswers: z.array(text(200)).max(10).default([]),
  partOfSpeech: text(40).optional(),
  phonetic: text(100).optional(),
  examples: z.array(z.object({ text: text(500).min(1), translationVi: text(500).optional() })).max(10).default([]),
  hints: z.array(z.object({ type: z.enum(["first_letter", "letter_count", "custom"]), value: text(300).min(1) })).max(10).default([]),
  tags: z.array(text(40).min(1)).max(20).default([]),
  notes: text(2000).optional(),
  audioKey: z.string().max(300).optional(),
  imageKey: z.string().max(300).optional(),
});

/** accepted_answers always contains the term itself, first, without duplicates (spec 3.2). */
function answers(term: string, extra: string[]) {
  return [...new Set([term, ...extra.filter(Boolean)])];
}

export async function createVocab(ownerId: ObjectId, raw: z.input<typeof vocabInput>, now = new Date()) {
  const input = vocabInput.parse(raw);
  const deck = await getOwnedDeck(ownerId, input.deckId);
  const { vocab } = await collections();
  const doc: VocabDoc = {
    _id: new ObjectId(),
    ownerId,
    deckId: deck._id,
    deckPath: deck.path,
    languageCode: input.languageCode,
    term: input.term,
    meaningVi: input.meaningVi,
    acceptedAnswers: answers(input.term, input.acceptedAnswers),
    partOfSpeech: input.partOfSpeech || undefined,
    phonetic: input.phonetic || undefined,
    examples: input.examples,
    hints: input.hints,
    tags: input.tags,
    notes: input.notes || undefined,
    audioKey: input.audioKey,
    imageKey: input.imageKey,
    status: "active",
    srs: newSrs(now),
    createdAt: now,
    updatedAt: now,
  };
  await vocab.insertOne(doc);
  return doc;
}

export async function getOwnedVocab(ownerId: ObjectId, id: string) {
  const { vocab } = await collections();
  const doc = await vocab.findOne({ _id: new ObjectId(parseId(id)), ownerId });
  if (!doc) throw notFound("Không tìm thấy từ");
  return doc;
}

/** Edits content and may move the word to another deck. SRS state is never touched here. */
export async function updateVocab(ownerId: ObjectId, id: string, raw: z.input<typeof vocabInput>, now = new Date()) {
  const input = vocabInput.parse(raw);
  const current = await getOwnedVocab(ownerId, id);
  const deck = await getOwnedDeck(ownerId, input.deckId);
  const { vocab } = await collections();
  await vocab.updateOne(
    { _id: current._id },
    {
      $set: {
        deckId: deck._id,
        deckPath: deck.path,
        languageCode: input.languageCode,
        term: input.term,
        meaningVi: input.meaningVi,
        acceptedAnswers: answers(input.term, input.acceptedAnswers),
        partOfSpeech: input.partOfSpeech || undefined,
        phonetic: input.phonetic || undefined,
        examples: input.examples,
        hints: input.hints,
        tags: input.tags,
        notes: input.notes || undefined,
        audioKey: input.audioKey,
        imageKey: input.imageKey,
        updatedAt: now,
      },
    }
  );
}

export async function setVocabStatus(ownerId: ObjectId, id: string, status: VocabDoc["status"], now = new Date()) {
  const current = await getOwnedVocab(ownerId, id);
  const { vocab } = await collections();
  await vocab.updateOne({ _id: current._id }, { $set: { status, updatedAt: now } });
}

/** Reset progress: back to NEW. Review logs are kept for history. */
export async function resetVocabProgress(ownerId: ObjectId, id: string, now = new Date()) {
  const current = await getOwnedVocab(ownerId, id);
  const { vocab } = await collections();
  await vocab.updateOne({ _id: current._id }, { $set: { srs: { ...newSrs(now), revision: current.srs.revision + 1 }, updatedAt: now } });
}

export async function listDeckVocab(ownerId: ObjectId, deckId: string, opts: { q?: string; includeSubdecks?: boolean; limit?: number; skip?: number } = {}) {
  const deck = await getOwnedDeck(ownerId, deckId);
  const { vocab } = await collections();
  const filter: Record<string, unknown> = {
    ownerId,
    status: { $ne: "archived" },
    ...(opts.includeSubdecks ? { deckPath: deck._id } : { deckId: deck._id }),
  };
  if (opts.q) {
    const rx = new RegExp(opts.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ term: rx }, { meaningVi: rx }, { tags: rx }];
  }
  return vocab
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(opts.skip ?? 0)
    .limit(opts.limit ?? 50)
    .toArray();
}
