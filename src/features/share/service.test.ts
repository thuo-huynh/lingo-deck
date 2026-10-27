import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { setupTestMongo } from "@/test/mongo";
import { collections } from "@/lib/db";
import { createDeck, listDecks } from "@/features/decks/service";
import { createVocab } from "@/features/vocab/service";
import { copySharedDeck, setSharing, sharePreview } from "./service";
import { safeNext } from "./path";

setupTestMongo();

const owner = new ObjectId();
const friend = new ObjectId();

async function sharedTree() {
  const root = await createDeck(owner, { name: "日本語", languageCode: "ja-JP" });
  const sub = await createDeck(owner, { name: "N5", parentId: root._id.toHexString() });
  const w = await createVocab(owner, { deckId: sub._id.toHexString(), term: "ねこ", meaningVi: "mèo" });
  const { vocab } = await collections();
  await vocab.updateOne({ _id: w._id }, { $set: { "srs.state": "REVIEW", "srs.revision": 9 } });
  const token = (await setSharing(owner, root._id.toHexString(), true))!;
  return { root, sub, token };
}

describe("share by link", () => {
  it("copies the deck tree and words with fresh progress into the recipient's library", async () => {
    const { token } = await sharedTree();
    const r = await copySharedDeck(friend, token);
    expect(r.created).toBe(true);

    const mine = await listDecks(friend);
    expect(mine.map((d) => d.name).sort()).toEqual(["N5", "日本語"]);
    const sub = mine.find((d) => d.name === "N5")!;
    expect(sub.path.map(String)).toEqual([r.id, sub._id.toHexString()]);

    const { vocab } = await collections();
    const words = await vocab.find({ ownerId: friend }).toArray();
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({ term: "ねこ", deckId: sub._id, languageCode: "ja-JP", srs: { state: "NEW", revision: 0 } });
  });

  it("adding the same link twice returns the existing copy", async () => {
    const { token } = await sharedTree();
    const first = await copySharedDeck(friend, token);
    const again = await copySharedDeck(friend, token);
    expect(again).toEqual({ id: first.id, created: false });
    expect((await sharePreview(token, friend)).copyId).toBe(first.id);
  });

  it("previews name, count and first words, and the link stops working once turned off", async () => {
    const { root, token } = await sharedTree();
    expect(await sharePreview(token)).toMatchObject({ name: "日本語", wordCount: 1, subdecks: 1, sample: [{ term: "ねこ", meaningVi: "mèo" }] });
    await setSharing(owner, root._id.toHexString(), false);
    await expect(sharePreview(token)).rejects.toThrow("không còn hoạt động");
    await expect(copySharedDeck(friend, token)).rejects.toThrow();
  });

  it("only the owner can share a deck", async () => {
    const { root } = await sharedTree();
    await expect(setSharing(friend, root._id.toHexString(), true)).rejects.toThrow();
  });
});

describe("safeNext", () => {
  it("only allows share links as a return path", () => {
    expect(safeNext("/share/abcdefghijk")).toBe("/share/abcdefghijk");
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("https://evil.com/share/abcdefghijk")).toBeNull();
  });
});
