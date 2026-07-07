import { describe, expect, it } from "vitest";
import { sanitizeText } from "../src/lib/sanitize";

describe("sanitize", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText("<script>alert(1)</script>Hello")).toBe("Hello");
  });

  it("trims and limits length", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
    expect(sanitizeText("a".repeat(6000)).length).toBe(5000);
  });
});
