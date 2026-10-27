import { describe, expect, it } from "vitest";
import { toBlanks } from "./view";

describe("toBlanks", () => {
  it("hides each letter and keeps spaces and punctuation", () => {
    expect(toBlanks("big")).toBe("___");
    expect(toBlanks("ice cream")).toBe("___ _____");
    expect(toBlanks("don't")).toBe("___'_");
    expect(toBlanks("こんにちは")).toBe("_____");
  });
});
