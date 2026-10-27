import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { collections, getClient } from "@/lib/db";
import { notFound } from "@/lib/errors";
import type { DeckDoc, VocabDoc } from "@/lib/types";
import { deckLanguage, getOwnedDeck } from "@/features/decks/service";
import { newSrs } from "@/features/scheduling/fsrs";

/** Turns the deck's share link on (keeping an existing token) or off (the old link stops working). */
export async function setSharing(ownerId: ObjectId, deckId: string, enabled: boolean) {
  const deck = await getOwnedDeck(ownerId, deckId);
  const { decks } = await collections();
  const shareToken = enabled ? (deck.shareToken ?? randomBytes(16).toString("base64url")) : null;
  await decks.updateOne({ _id: deck._id }, { $set: { shareToken } });
  return shareToken;
}

async function sharedTree(token: string) {
  const { decks } = await collections();
  const root = await decks.findOne({ shareToken: token, archivedAt: null });
  if (!root) throw notFound("Link chia sẻ không còn hoạt động");
  return root;
}

const liveWords = (root: DeckDoc) => ({ ownerId: root.ownerId, deckPath: root._id, status: { $ne: "archived" as const } });

/** What a visitor sees before adding: never progress, history or the owner's identity. */
export async function sharePreview(token: string, viewerId?: ObjectId) {
  const root = await sharedTree(token);
  const { decks, vocab } = await collections();
  const [wordCount, sample, subdecks, existing] = await Promise.all([
    vocab.countDocuments(liveWords(root)),
    vocab.find(liveWords(root), { projection: { term: 1, meaningVi: 1 } }).sort({ createdAt: 1 }).limit(5).toArray(),
    decks.countDocuments({ ownerId: root.ownerId, path: root._id, archivedAt: null, _id: { $ne: root._id } }),
    viewerId ? decks.findOne({ ownerId: viewerId, copiedFromId: root._id, archivedAt: null }) : null,
  ]);
  return {
    name: root.name,
    description: root.description,
    color: root.color,
    languageCode: await deckLanguage(root),
    wordCount,
    subdecks,
    sample: sample.map((w) => ({ term: w.term, meaningVi: w.meaningVi })),
    own: !!viewerId && root.ownerId.equals(viewerId),
    copyId: existing?._id.toHexString() ?? null,
  };
}

/**
 * Adds a copy of the shared deck tree to the viewer's library: same content, fresh progress.
 * Adding the same link twice returns the existing copy.
 */
export async function copySharedDeck(userId: ObjectId, token: string, now = new Date()) {
  const root = await sharedTree(token);
  const { decks, vocab } = await collections();
  const existing = await decks.findOne({ ownerId: userId, copiedFromId: root._id, archivedAt: null });
  if (existing) return { id: existing._id.toHexString(), created: false };

  const [tree, words, roots] = await Promise.all([
    decks.find({ ownerId: root.ownerId, path: root._id, archivedAt: null }).toArray(),
    vocab.find(liveWords(root)).toArray(),
    decks.countDocuments({ ownerId: userId, parentId: null }),
  ]);
  const rootLanguage = await deckLanguage(root);
  // Old deck id → new deck id, so paths can be rewritten in any order.
  const ids = new Map(tree.map((d) => [d._id.toHexString(), new ObjectId()]));
  const at = root.path.length - 1;
  const copies: DeckDoc[] = tree.map((d) => {
    const path = d.path.slice(at).map((id) => ids.get(id.toHexString())!);
    return {
      _id: path[path.length - 1],
      ownerId: userId,
      parentId: path.length > 1 ? path[path.length - 2] : null,
      path,
      name: d.name,
      description: d.description,
      color: d.color,
      languageCode: d.languageCode ?? rootLanguage,
      sortOrder: d._id.equals(root._id) ? roots : d.sortOrder,
      settings: d.settings,
      archivedAt: null,
      createdAt: now,
      ...(d._id.equals(root._id) ? { copiedFromId: root._id } : {}),
    };
  });
  const byId = new Map(copies.map((c) => [c._id.toHexString(), c]));
  const wordCopies: VocabDoc[] = words.filter((w) => ids.has(w.deckId.toHexString())).map((w) => {
    const deck = byId.get(ids.get(w.deckId.toHexString())!.toHexString())!;
    return {
      _id: new ObjectId(),
      ownerId: userId,
      deckId: deck._id,
      deckPath: deck.path,
      languageCode: w.languageCode,
      term: w.term,
      meaningVi: w.meaningVi,
      acceptedAnswers: w.acceptedAnswers,
      partOfSpeech: w.partOfSpeech,
      phonetic: w.phonetic,
      examples: w.examples,
      hints: w.hints,
      tags: w.tags,
      notes: w.notes,
      // shortcut: uploaded audio/images stay with the owner (media is per-user), copies use TTS; copy the files once media storage is on.
      status: w.status === "suspended" ? "active" : w.status,
      srs: newSrs(now),
      createdAt: now,
      updatedAt: now,
    };
  });
  const client = await getClient();
  await client.withSession((s) =>
    s.withTransaction(async () => {
      await decks.insertMany(copies, { session: s });
      if (wordCopies.length) await vocab.insertMany(wordCopies, { session: s });
    })
  );
  return { id: copies.find((c) => c.parentId === null)!._id.toHexString(), created: true };
}
