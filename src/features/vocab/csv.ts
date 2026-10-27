import { normalizeAnswer } from "@/features/study/answer";

/** RFC 4180 CSV: quoted fields may hold commas, doubled quotes and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows.filter((r) => r.some((f) => f.trim()));
}

export function toCsv(rows: string[][]) {
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/**
 * A pasted list, one "term - meaning" per line, as import CSV (#3).
 * Tab wins, then a spaced dash, then ":" or a bare "-", so hyphenated terms like "well-known - nổi tiếng" survive.
 */
export function listToCsv(text: string) {
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.*?)\t(.*)$/) ?? l.match(/^(.*?)\s+[-–—]\s+(.*)$/) ?? l.match(/^(.*?)\s*[:=]\s*(.*)$/) ?? l.match(/^(.*?)-(.*)$/);
      return m ? [m[1].trim(), m[2].trim()] : [l, ""];
    });
  return toCsv([["term", "meaning_vi"], ...rows]);
}

export const CSV_COLUMNS = ["term", "meaning_vi", "example", "example_vi", "phonetic", "part_of_speech", "tags", "accepted"] as const;

export type ImportRow = {
  line: number;
  term: string;
  meaningVi: string;
  status: "ok" | "duplicate" | "error";
  note?: string;
  input?: {
    term: string;
    meaningVi: string;
    phonetic?: string;
    partOfSpeech?: string;
    examples: { text: string; translationVi?: string }[];
    tags: string[];
    acceptedAnswers: string[];
  };
};

const list = (v = "") => v.split(/[;|]/).map((x) => x.trim()).filter(Boolean);

/** Validates a CSV against the deck's existing terms (spec SCR-13). Duplicates and errors are skipped on commit. */
export function previewImport(text: string, existingTerms: string[]): ImportRow[] {
  const [header, ...body] = parseCsv(text);
  const cols = (header ?? []).map((h) => h.trim().toLowerCase());
  const at = (name: string) => cols.indexOf(name);
  if (at("term") < 0 || at("meaning_vi") < 0) throw new Error("File cần có cột term và meaning_vi");

  const seen = new Set(existingTerms.map((t) => normalizeAnswer(t)));
  return body.map((r, i) => {
    const get = (name: string) => (at(name) >= 0 ? (r[at(name)] ?? "").trim() : "");
    const term = get("term");
    const meaningVi = get("meaning_vi");
    const line = i + 2;
    if (!term) return { line, term, meaningVi, status: "error", note: "Thiếu cột term" };
    if (!meaningVi) return { line, term, meaningVi, status: "error", note: "Thiếu cột meaning_vi" };
    if (term.length > 200 || meaningVi.length > 500) return { line, term, meaningVi, status: "error", note: "Nội dung quá dài" };
    const key = normalizeAnswer(term);
    if (seen.has(key)) return { line, term, meaningVi, status: "duplicate", note: "Trùng với từ đã có trong bộ" };
    seen.add(key);
    const example = get("example");
    return {
      line,
      term,
      meaningVi,
      status: "ok",
      input: {
        term,
        meaningVi,
        phonetic: get("phonetic") || undefined,
        partOfSpeech: get("part_of_speech") || undefined,
        examples: example ? [{ text: example, translationVi: get("example_vi") || undefined }] : [],
        tags: list(get("tags")).slice(0, 20),
        acceptedAnswers: list(get("accepted")).slice(0, 10),
      },
    };
  });
}
