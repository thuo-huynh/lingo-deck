import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { setupTestMongo } from "@/test/mongo";
import { collections } from "@/lib/db";
import { createDeck } from "@/features/decks/service";
import { createVocab, exportCsv, importCsv } from "./service";

setupTestMongo();

const owner = new ObjectId();
const csv = "term,meaning_vi,tags\nbreakfast,bữa sáng,food\napple,quả táo,\nlaundry,,\n";

describe("CSV import", () => {
  it("preview writes nothing; commit inserts only valid, new rows; re-import adds nothing", async () => {
    const deck = await createDeck(owner, { name: "Daily" });
    await createVocab(owner, { deckId: deck._id.toHexString(), term: "Apple", meaningVi: "quả táo" });
    const id = deck._id.toHexString();
    const { vocab } = await collections();

    const preview = await importCsv(owner, id, csv, false);
    expect(preview.rows.map((r) => r.status)).toEqual(["ok", "duplicate", "error"]);
    expect(await vocab.countDocuments({ ownerId: owner })).toBe(1);

    expect((await importCsv(owner, id, csv, true)).imported).toBe(1);
    expect((await importCsv(owner, id, csv, true)).imported).toBe(0);
    const added = await vocab.findOne({ term: "breakfast" });
    expect(added).toMatchObject({ deckPath: deck.path, tags: ["food"], srs: { state: "NEW" } });
  });

  it("refuses another user's deck", async () => {
    const deck = await createDeck(owner, { name: "Mine" });
    await expect(importCsv(new ObjectId(), deck._id.toHexString(), csv, true)).rejects.toThrow();
  });

  it("exports what it imports", async () => {
    const deck = await createDeck(owner, { name: "Round" });
    await importCsv(owner, deck._id.toHexString(), csv, true);
    const out = await exportCsv(owner, deck._id.toHexString());
    expect(out.csv).toContain("breakfast,bữa sáng,,,,,food,");
  });
});
