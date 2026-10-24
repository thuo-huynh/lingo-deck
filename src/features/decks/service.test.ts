import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { setupTestMongo } from "@/test/mongo";
import { collections } from "@/lib/db";
import { createVocab } from "@/features/vocab/service";
import { archiveDeck, createDeck, listDecks, moveDeck } from "./service";

setupTestMongo();

const owner = new ObjectId();

describe("archiveDeck", () => {
  it("moves every word of the subtree to another deck, keeping progress, when asked", async () => {
    const a = await createDeck(owner, { name: "A" });
    const a1 = await createDeck(owner, { name: "A1", parentId: a._id.toHexString() });
    const b = await createDeck(owner, { name: "B" });
    const w = await createVocab(owner, { deckId: a1._id.toHexString(), term: "cat", meaningVi: "mèo" });
    const { vocab } = await collections();
    await vocab.updateOne({ _id: w._id }, { $set: { "srs.revision": 7 } });

    await archiveDeck(owner, a._id.toHexString(), b._id.toHexString());

    const moved = await vocab.findOne({ _id: w._id });
    expect(moved).toMatchObject({ deckId: b._id, deckPath: b.path, status: "active", srs: { revision: 7 } });
    expect((await listDecks(owner)).map((d) => d.name)).toEqual(["B"]);
  });

  it("refuses to move words into the deck being deleted or one of its subdecks", async () => {
    const a = await createDeck(owner, { name: "A" });
    const a1 = await createDeck(owner, { name: "A1", parentId: a._id.toHexString() });
    await expect(archiveDeck(owner, a._id.toHexString(), a1._id.toHexString())).rejects.toThrow();
  });

  it("archives the words with the decks when no target is given", async () => {
    const a = await createDeck(owner, { name: "A" });
    const w = await createVocab(owner, { deckId: a._id.toHexString(), term: "dog", meaningVi: "chó" });
    await archiveDeck(owner, a._id.toHexString());
    const { vocab } = await collections();
    expect((await vocab.findOne({ _id: w._id }))!.status).toBe("archived");
  });
});

describe("moveDeck", () => {
  it("swaps a deck with its sibling above or below", async () => {
    await createDeck(owner, { name: "A" });
    const b = await createDeck(owner, { name: "B" });
    await createDeck(owner, { name: "C" });
    await moveDeck(owner, b._id.toHexString(), "up");
    expect((await listDecks(owner)).map((d) => d.name)).toEqual(["B", "A", "C"]);
    await moveDeck(owner, b._id.toHexString(), "up"); // already first: no-op
    await moveDeck(owner, b._id.toHexString(), "down");
    expect((await listDecks(owner)).map((d) => d.name)).toEqual(["A", "B", "C"]);
  });
});
