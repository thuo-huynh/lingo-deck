import "server-only";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { collections } from "@/lib/db";
import { badRequest, notFound, parseId } from "@/lib/errors";
import type { DeckDoc, VocabDoc } from "@/lib/types";
import { CSV_COLUMNS, previewImport, toCsv } from "./csv";
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
  const doc = buildVocab(ownerId, deck, input, now);
  await vocab.insertOne(doc);
  return doc;
}

function buildVocab(ownerId: ObjectId, deck: DeckDoc, input: z.output<typeof vocabInput>, now: Date): VocabDoc {
  return {
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
}

const MAX_IMPORT_BYTES = 1_000_000;
const MAX_IMPORT_ROWS = 2000;

/** CSV import (spec SCR-13): preview validates; commit re-validates server-side and inserts only valid rows. */
export async function importCsv(ownerId: ObjectId, deckId: string, csv: string, commit: boolean, now = new Date()) {
  if (csv.length > MAX_IMPORT_BYTES) throw badRequest("File quá lớn (tối đa 1 MB)");
  const deck = await getOwnedDeck(ownerId, deckId);
  const { vocab } = await collections();
  const existing = await vocab.distinct("term", { ownerId, deckId: deck._id, status: { $ne: "archived" } });
  let rows;
  try {
    rows = previewImport(csv, existing);
  } catch (e) {
    throw badRequest(e instanceof Error ? e.message : "File CSV không hợp lệ");
  }
  if (rows.length > MAX_IMPORT_ROWS) throw badRequest(`Tối đa ${MAX_IMPORT_ROWS} dòng mỗi lần nhập`);
  if (!commit) return { rows, imported: 0 };
  // Every row goes through the same validation as the editor; a row that fails is reported, not inserted.
  // Imported words take the language already used in this deck tree.
  const last = await vocab.findOne({ ownerId, deckPath: deck.path[0] }, { sort: { createdAt: -1 }, projection: { languageCode: 1 } });
  const docs: VocabDoc[] = [];
  for (const r of rows) {
    if (r.status !== "ok" || !r.input) continue;
    const parsed = vocabInput.safeParse({ ...r.input, deckId, languageCode: last?.languageCode ?? "en-US" });
    if (parsed.success) docs.push(buildVocab(ownerId, deck, parsed.data, now));
    else Object.assign(r, { status: "error", note: parsed.error.issues[0]?.message });
  }
  if (docs.length) await vocab.insertMany(docs);
  return { rows, imported: docs.length };
}

export async function exportCsv(ownerId: ObjectId, deckId: string) {
  const deck = await getOwnedDeck(ownerId, deckId);
  const { vocab } = await collections();
  const words = await vocab.find({ ownerId, deckPath: deck._id, status: { $ne: "archived" } }).sort({ createdAt: 1 }).toArray();
  return {
    name: deck.name,
    csv: toCsv([
      [...CSV_COLUMNS],
      ...words.map((w) => [
        w.term,
        w.meaningVi,
        w.examples[0]?.text ?? "",
        w.examples[0]?.translationVi ?? "",
        w.phonetic ?? "",
        w.partOfSpeech ?? "",
        w.tags.join(";"),
        w.acceptedAnswers.filter((a) => a !== w.term).join(";"),
      ]),
    ]),
  };
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
