import { describe, expect, it } from "vitest";
import {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  createLoginCode,
  generateCode,
  hashCode,
  latestActiveCode,
  verifyLoginCode,
} from "@/lib/auth/codes";

const SECRET = "test-secret";
const NOW = Date.parse("2026-01-01T12:00:00Z");

describe("login codes", () => {
  it("generates zero-padded 6-digit codes", () => {
    expect(generateCode(() => 7)).toBe("000007");
    expect(generateCode(() => 123456)).toBe("123456");
    expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("stores only a hash, never the code", () => {
    const { code, record } = createLoginCode({ email: "A@Example.com", secret: SECRET, now: NOW });
    expect(record.codeHash).not.toContain(code);
    expect(record.codeHash).toBe(hashCode(code, "a@example.com", SECRET));
    expect(record.email).toBe("a@example.com");
    expect(record.used).toBe(false);
    expect(record.attempts).toBe(0);
    expect(Date.parse(record.expiresAt)).toBe(NOW + CODE_TTL_MS);
  });

  it("verifies the right code and marks it used", () => {
    const { code, record } = createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW });
    const result = verifyLoginCode(record, code, SECRET, NOW + 1000);
    expect(result.ok).toBe(true);
    expect(result.record.used).toBe(true);
    expect(result.record.attempts).toBe(1);
  });

  it("rejects a wrong code and counts the attempt", () => {
    const { code, record } = createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW });
    const wrong = code === "000000" ? "111111" : "000000";
    const result = verifyLoginCode(record, wrong, SECRET, NOW + 1000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("mismatch");
    expect(result.record.attempts).toBe(1);
    expect(result.record.used).toBe(false);
  });

  it("rejects expired codes", () => {
    const { code, record } = createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW });
    const result = verifyLoginCode(record, code, SECRET, NOW + CODE_TTL_MS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  it("rejects already-used codes", () => {
    const { code, record } = createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW });
    const first = verifyLoginCode(record, code, SECRET, NOW + 1);
    const second = verifyLoginCode(first.record, code, SECRET, NOW + 2);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("used");
  });

  it("locks out after the attempt limit, even with the right code", () => {
    const { code, record } = createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW });
    const wrong = code === "000000" ? "111111" : "000000";
    let current = record;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const r = verifyLoginCode(current, wrong, SECRET, NOW + i);
      expect(r.ok).toBe(false);
      current = r.record;
    }
    expect(current.attempts).toBe(MAX_ATTEMPTS);
    const final = verifyLoginCode(current, code, SECRET, NOW + 100);
    expect(final.ok).toBe(false);
    if (!final.ok) expect(final.reason).toBe("too_many_attempts");
  });

  it("does not accept a code issued for a different email", () => {
    const a = createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW });
    const b = createLoginCode({ email: "b@example.com", secret: SECRET, now: NOW });
    const result = verifyLoginCode(b.record, a.code, SECRET, NOW + 1);
    // Could coincidentally match if both random codes are equal; guard that.
    if (a.code !== b.code) expect(result.ok).toBe(false);
  });

  it("picks the most recent active code for an email", () => {
    const older = createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW - 60_000, id: "old" }).record;
    const newer = createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW, id: "new" }).record;
    const used = { ...createLoginCode({ email: "a@example.com", secret: SECRET, now: NOW + 1, id: "used" }).record, used: true };
    const other = createLoginCode({ email: "z@example.com", secret: SECRET, now: NOW + 5, id: "other" }).record;
    expect(latestActiveCode([older, newer, used, other], "A@example.com", NOW + 10)?.id).toBe("new");
    expect(latestActiveCode([older], "a@example.com", NOW + CODE_TTL_MS)).toBeNull();
  });
});
