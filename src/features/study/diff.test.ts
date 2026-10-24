import { describe, expect, it } from "vitest";
import { markAnswer } from "./diff";

const show = (parts: ReturnType<typeof markAnswer>) => parts.map((p) => (p.wrong ? `[${p.text}]` : p.text)).join("");

describe("markAnswer", () => {
  it("marks the letter the learner missed", () => {
    expect(show(markAnswer("apple", "aple"))).toBe("ap[p]le");
  });

  it("marks swapped letters", () => {
    expect(show(markAnswer("apple", "appel"))).toBe("app[l]e");
  });

  it("marks nothing when only case differs", () => {
    expect(show(markAnswer("Apple", "apple"))).toBe("Apple");
  });

  it("marks everything for an empty answer", () => {
    expect(show(markAnswer("cat", ""))).toBe("[cat]");
  });
});
