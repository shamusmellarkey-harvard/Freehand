import { createHmac, randomInt } from "node:crypto";
import type { LoginCode } from "@/lib/types";

export const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_ATTEMPTS = 5;
export const CODE_LENGTH = 6;

/** Six-digit numeric code, zero-padded. */
export function generateCode(random: () => number = () => randomInt(0, 1_000_000)): string {
  return String(random()).padStart(CODE_LENGTH, "0").slice(-CODE_LENGTH);
}

/** HMAC of the code bound to the email so hashes are not reusable across accounts. */
export function hashCode(code: string, email: string, secret: string): string {
  return createHmac("sha256", secret).update(`${email.toLowerCase()}:${code}`).digest("hex");
}

export interface CreateCodeOptions {
  email: string;
  secret: string;
  now?: number;
  random?: () => number;
  id?: string;
}

/** Creates a login code and the record to store. Only the hash is stored. */
export function createLoginCode(opts: CreateCodeOptions): { code: string; record: LoginCode } {
  const now = opts.now ?? Date.now();
  const code = generateCode(opts.random);
  const record: LoginCode = {
    id: opts.id ?? `lc_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email: opts.email.toLowerCase(),
    codeHash: hashCode(code, opts.email, opts.secret),
    expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
    used: false,
    attempts: 0,
  };
  return { code, record };
}

export type VerifyFailure = "expired" | "used" | "too_many_attempts" | "mismatch";

export type VerifyResult =
  | { ok: true; record: LoginCode }
  | { ok: false; reason: VerifyFailure; record: LoginCode };

/**
 * Verifies a submitted code against a stored record. Returns the updated
 * record (attempts incremented, or marked used) which the caller must persist.
 */
export function verifyLoginCode(record: LoginCode, code: string, secret: string, now = Date.now()): VerifyResult {
  if (record.used) return { ok: false, reason: "used", record };
  if (Date.parse(record.expiresAt) <= now) return { ok: false, reason: "expired", record };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts", record };

  const attempted = { ...record, attempts: record.attempts + 1 };
  const expected = record.codeHash;
  const actual = hashCode(code.trim(), record.email, secret);
  if (!timingSafeEqualHex(expected, actual)) {
    return { ok: false, reason: "mismatch", record: attempted };
  }
  return { ok: true, record: { ...attempted, used: true } };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Pick the most recent usable record for an email. */
export function latestActiveCode(records: LoginCode[], email: string, now = Date.now()): LoginCode | null {
  const e = email.toLowerCase();
  const candidates = records
    .filter((r) => r.email === e && !r.used && Date.parse(r.expiresAt) > now)
    .sort((a, b) => Date.parse(b.expiresAt) - Date.parse(a.expiresAt));
  return candidates[0] ?? null;
}

export function describeFailure(reason: VerifyFailure): string {
  switch (reason) {
    case "expired":
      return "That code has expired. Request a new one.";
    case "used":
      return "That code was already used. Request a new one.";
    case "too_many_attempts":
      return "Too many attempts. Request a new code.";
    case "mismatch":
      return "That code is not right. Check it and try again.";
  }
}
