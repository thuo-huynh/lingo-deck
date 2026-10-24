import { describe, expect, it } from "vitest";
import { parseCsv, previewImport, toCsv } from "./csv";

describe("parseCsv", () => {
  it("reads quoted fields with commas, quotes and newlines, and strips a BOM", () => {
    const text = '﻿term,meaning_vi\r\n"ice cream","kem, ""lạnh"""\n"two\nlines",x\n';
    expect(parseCsv(text)).toEqual([
      ["term", "meaning_vi"],
      ["ice cream", 'kem, "lạnh"'],
      ["two\nlines", "x"],
    ]);
  });
});

describe("previewImport", () => {
  const csv = [
    "term,meaning_vi,example,example_vi,phonetic,tags",
    "breakfast,bữa sáng,I eat breakfast.,Tôi ăn sáng.,/ˈbrek.fəst/,food;A1",
    "Apple,quả táo,,,,",
    "laundry,,,,,",
    "breakfast,bữa điểm tâm,,,,",
  ].join("\n");

  it("marks valid, duplicate (in deck or earlier in file) and invalid rows with their line numbers", () => {
    const rows = previewImport(csv, ["apple"]);
    expect(rows.map((r) => [r.line, r.status])).toEqual([
      [2, "ok"],
      [3, "duplicate"],
      [4, "error"],
      [5, "duplicate"],
    ]);
    expect(rows[2].note).toMatch(/meaning_vi/);
    expect(rows[0].input).toMatchObject({
      term: "breakfast",
      meaningVi: "bữa sáng",
      phonetic: "/ˈbrek.fəst/",
      examples: [{ text: "I eat breakfast.", translationVi: "Tôi ăn sáng." }],
      tags: ["food", "A1"],
    });
  });

  it("rejects a file without the required columns", () => {
    expect(() => previewImport("word,meaning\nx,y", [])).toThrow(/term/);
  });
});

describe("toCsv", () => {
  it("round-trips through parseCsv", () => {
    const rows = [["term", "meaning_vi"], ['say "hi"', "chào, bạn"]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
