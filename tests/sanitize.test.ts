import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanLine, cleanText, normalizeEmail } from "@/lib/sanitize";

describe("sanitize", () => {
  it("strips control characters and caps length", () => {
    expect(cleanText("hello\u0000 world\u0007", 100)).toBe("hello world");
    expect(cleanText("a".repeat(50), 10)).toHaveLength(10);
  });

  it("collapses excessive blank lines and trims", () => {
    expect(cleanText("  a\n\n\n\n\nb  ", 100)).toBe("a\n\nb");
    expect(cleanText("a\r\nb", 100)).toBe("a\nb");
  });

  it("removes zero-width and bidi override characters", () => {
    expect(cleanText("ab​c‮d", 100)).toBe("abcd");
  });

  it("keeps HTML as literal text (React escapes on render)", () => {
    expect(cleanLine("<script>alert(1)</script>", 100)).toBe("<script>alert(1)</script>");
  });

  it("normalizes emails", () => {
    expect(normalizeEmail("  Foo@Example.COM ")).toBe("foo@example.com");
  });
});

describe("rate limit", () => {
  it("allows up to the limit then blocks within the window", () => {
    const key = `test-${Math.random()}`;
    const t0 = 1_000_000;
    expect(checkRateLimit(key, 2, 1000, t0).ok).toBe(true);
    expect(checkRateLimit(key, 2, 1000, t0 + 1).ok).toBe(true);
    const blocked = checkRateLimit(key, 2, 1000, t0 + 2);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(checkRateLimit(key, 2, 1000, t0 + 1001).ok).toBe(true);
  });
});
