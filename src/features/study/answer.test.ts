import { describe, expect, it } from "vitest";
import { checkAnswer } from "./answer";

describe("checkAnswer", () => {
  it("accepts an exact accepted answer", () => {
    expect(checkAnswer("apple", ["apple"]).correct).toBe(true);
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(checkAnswer("  ice   cream ", ["ice cream"]).correct).toBe(true);
  });

  it("ignores case unless the preset is case sensitive", () => {
    expect(checkAnswer("Apple", ["apple"]).correct).toBe(true);
    expect(checkAnswer("Apple", ["apple"], { caseSensitive: true }).correct).toBe(false);
  });

  it("treats composed and decomposed Unicode as equal", () => {
    expect(checkAnswer("café", ["café"]).correct).toBe(true);
  });

  it("does not strip diacritics", () => {
    expect(checkAnswer("cafe", ["café"]).correct).toBe(false);
  });

  it("accepts any listed spelling and reports the primary answer", () => {
    const r = checkAnswer("colour", ["color", "colour"]);
    expect(r).toEqual({ correct: true, expected: "color" });
  });

  it("keeps word order for phrases", () => {
    expect(checkAnswer("cream ice", ["ice cream"]).correct).toBe(false);
  });

  it("rejects empty input", () => {
    expect(checkAnswer("   ", ["apple"]).correct).toBe(false);
  });
});
