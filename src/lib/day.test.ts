import { describe, expect, it } from "vitest";
import { studyDay } from "./day";

describe("studyDay", () => {
  it("starts the day at the learner's start hour in their timezone", () => {
    // 2026-10-24 02:00 in Ho Chi Minh (UTC+7) is before a 4am day start → still the 23rd.
    const d = studyDay(new Date("2026-10-23T19:00:00Z"), "Asia/Ho_Chi_Minh", 4);
    expect(d.key).toBe("2026-10-23");
    expect(d.start.toISOString()).toBe("2026-10-22T21:00:00.000Z");
    expect(d.end.toISOString()).toBe("2026-10-23T21:00:00.000Z");
  });

  it("handles a DST change inside the day", () => {
    // New York falls back on 2026-11-01: that day is 25 hours long.
    const d = studyDay(new Date("2026-11-01T15:00:00Z"), "America/New_York", 0);
    expect(d.key).toBe("2026-11-01");
    expect((d.end.getTime() - d.start.getTime()) / 3_600_000).toBe(25);
  });
});
