import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/features/decks/settings";
import { newSrs, schedule } from "./fsrs";

const t0 = new Date("2026-10-24T08:00:00Z");
const minutes = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 60_000;

describe("FSRS adapter", () => {
  it("starts a word as NEW and due now", () => {
    const s = newSrs(t0);
    expect(s.state).toBe("NEW");
    expect(s.due).toEqual(t0);
    expect(s.revision).toBe(0);
  });

  it("puts a new word into LEARNING with the first 1m step on Again", () => {
    const s = schedule(newSrs(t0), "again", t0, DEFAULT_SETTINGS);
    expect(s.state).toBe("LEARNING");
    expect(minutes(t0, s.due)).toBe(1);
    expect(s.revision).toBe(1);
  });

  it("follows New → Learning → Review → Relearning", () => {
    let s = schedule(newSrs(t0), "good", t0, DEFAULT_SETTINGS); // 10m step
    expect(s.state).toBe("LEARNING");
    expect(minutes(t0, s.due)).toBe(10);
    s = schedule(s, "good", s.due, DEFAULT_SETTINGS);
    expect(s.state).toBe("REVIEW");
    expect(minutes(t0, s.due)).toBeGreaterThanOrEqual(24 * 60);
    s = schedule(s, "again", s.due, DEFAULT_SETTINGS);
    expect(s.state).toBe("RELEARNING");
    expect(s.card.lapses).toBe(1);
  });

  it("respects maximum interval", () => {
    let s = newSrs(t0);
    const settings = { ...DEFAULT_SETTINGS, maximumInterval: 30 };
    for (let i = 0; i < 12; i++) {
      const before = s.due;
      s = schedule(s, i % 2 ? "easy" : "good", s.due, settings);
      expect(s.card.scheduled_days).toBeLessThanOrEqual(30);
      expect(minutes(before, s.due)).toBeLessThanOrEqual(30 * 24 * 60);
    }
  });
});
