import "server-only";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { collections, getClient } from "@/lib/db";
import { badRequest, notFound, parseId } from "@/lib/errors";
import type { DeckDoc, DeckSettings } from "@/lib/types";
import { resolveSettings, settingsSchema } from "./settings";

export const DECK_COLORS = ["#E0663F", "#EE9A4D", "#D3A13A", "#3FA36F", "#4A86E8", "#8B6CD9", "#D9649B", "#7B8494"];

export const deckInput = z.object({
  name: z.string().trim().min(1, "Nhập tên bộ từ").max(80),
  description: z.string().trim().max(500).optional(),
  parentId: z.string().nullish(),
  color: z.enum(DECK_COLORS).optional(),
});

export async function getOwnedDeck(ownerId: ObjectId, deckId: string) {
  const { decks } = await collections();
  const deck = await decks.findOne({ _id: new ObjectId(parseId(deckId)), ownerId, archivedAt: null });
  if (!deck) throw notFound("Không tìm thấy bộ từ");
  return deck;
}

export async function createDeck(ownerId: ObjectId, raw: z.input<typeof deckInput>, now = new Date()) {
  const input = deckInput.parse(raw);
  const { decks } = await collections();
  const parent = input.parentId ? await getOwnedDeck(ownerId, input.parentId) : null;
  const _id = new ObjectId();
  const [count, total] = await Promise.all([
    decks.countDocuments({ ownerId, parentId: parent?._id ?? null }),
    decks.countDocuments({ ownerId }),
  ]);
  const deck: DeckDoc = {
    _id,
    ownerId,
    parentId: parent?._id ?? null,
    path: [...(parent?.path ?? []), _id],
    name: input.name,
    description: input.description,
    color: input.color ?? DECK_COLORS[total % DECK_COLORS.length],
    sortOrder: count,
    settings: null,
    archivedAt: null,
    createdAt: now,
  };
  await decks.insertOne(deck);
  return deck;
}

export async function updateDeck(ownerId: ObjectId, deckId: string, raw: Partial<z.input<typeof deckInput>>) {
  const input = deckInput.partial().parse(raw);
  const { decks, vocab } = await collections();
  const deck = await getOwnedDeck(ownerId, deckId);
  const $set: Partial<DeckDoc> = {};
  if (input.name !== undefined) $set.name = input.name;
  if (input.description !== undefined) $set.description = input.description;
  if (input.color !== undefined) $set.color = input.color;

  if (input.parentId !== undefined && String(input.parentId ?? "") !== String(deck.parentId ?? "")) {
    const parent = input.parentId ? await getOwnedDeck(ownerId, input.parentId) : null;
    if (parent?.path.some((id) => id.equals(deck._id))) throw badRequest("Không thể chuyển bộ từ vào chính bộ con của nó");
    const newPrefix = [...(parent?.path ?? []), deck._id];
    const oldLen = deck.path.length;
    // Move the subtree: every descendant deck and word gets the new path prefix.
    const client = await getClient();
    await client.withSession((s) =>
      s.withTransaction(async () => {
        await decks.updateOne({ _id: deck._id }, { $set: { ...$set, parentId: parent?._id ?? null, path: newPrefix } }, { session: s });
        for (const d of await decks.find({ ownerId, path: deck._id, _id: { $ne: deck._id } }, { session: s }).toArray()) {
          await decks.updateOne({ _id: d._id }, { $set: { path: [...newPrefix, ...d.path.slice(oldLen)] } }, { session: s });
        }
        for (const d of await decks.find({ ownerId, path: deck._id }, { session: s }).toArray()) {
          const p = d._id.equals(deck._id) ? newPrefix : [...newPrefix, ...d.path.slice(oldLen)];
          await vocab.updateMany({ ownerId, deckId: d._id }, { $set: { deckPath: p } }, { session: s });
        }
      })
    );
    return;
  }
  if (Object.keys($set).length) await decks.updateOne({ _id: deck._id }, { $set });
}

/** Soft delete: archives the deck and its subdecks. Words and their review history stay in the database. */
export async function archiveDeck(ownerId: ObjectId, deckId: string, moveWordsTo?: string | null, now = new Date()) {
  const deck = await getOwnedDeck(ownerId, deckId);
  const target = moveWordsTo ? await getOwnedDeck(ownerId, moveWordsTo) : null;
  if (target?.path.some((id) => id.equals(deck._id))) throw badRequest("Không thể chuyển từ vào bộ đang xoá");
  const { decks, vocab } = await collections();
  const client = await getClient();
  // Spec 10.2: deleting a deck either moves its words (keeping SRS history) or archives them; never hard-deletes.
  await client.withSession((s) =>
    s.withTransaction(async () => {
      if (target) {
        await vocab.updateMany(
          { ownerId, deckPath: deck._id },
          { $set: { deckId: target._id, deckPath: target.path, updatedAt: now } },
          { session: s }
        );
      } else {
        await vocab.updateMany(
          { ownerId, deckPath: deck._id, status: { $ne: "archived" } },
          { $set: { status: "archived", updatedAt: now } },
          { session: s }
        );
      }
      await decks.updateMany({ ownerId, path: deck._id }, { $set: { archivedAt: now } }, { session: s });
    })
  );
}

/** Swaps a deck with its previous/next sibling in the library order. */
export async function moveDeck(ownerId: ObjectId, deckId: string, direction: "up" | "down") {
  const deck = await getOwnedDeck(ownerId, deckId);
  const { decks } = await collections();
  const siblings = await decks
    .find({ ownerId, parentId: deck.parentId, archivedAt: null })
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray();
  const i = siblings.findIndex((d) => d._id.equals(deck._id));
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  // Renumber the whole sibling list so older duplicate sortOrder values cannot tie.
  await decks.bulkWrite(siblings.map((d, n) => ({ updateOne: { filter: { _id: d._id }, update: { $set: { sortOrder: n } } } })));
}

export async function getDeckSettings(ownerId: ObjectId, deck: DeckDoc): Promise<DeckSettings> {
  const { decks, users } = await collections();
  const [chain, user] = await Promise.all([
    decks.find({ ownerId, _id: { $in: deck.path } }).toArray(),
    users.findOne({ _id: ownerId }, { projection: { defaultSettings: 1 } }),
  ]);
  const byId = new Map(chain.map((d) => [d._id.toHexString(), d]));
  return resolveSettings([...deck.path].reverse().map((id) => byId.get(id.toHexString())!).filter(Boolean), user?.defaultSettings);
}

export async function updateDeckSettings(ownerId: ObjectId, deckId: string, raw: unknown) {
  const deck = await getOwnedDeck(ownerId, deckId);
  const settings = raw === null ? null : settingsSchema.parse(raw);
  const { decks } = await collections();
  await decks.updateOne({ _id: deck._id }, { $set: { settings } });
}

export async function listDecks(ownerId: ObjectId) {
  const { decks } = await collections();
  return decks.find({ ownerId, archivedAt: null }).sort({ sortOrder: 1, createdAt: 1 }).toArray();
}
