/**
 * Text sanitation for user input. React escapes HTML on render, so the goal
 * here is to normalize, strip control characters, and cap lengths so strangers
 * cannot break layouts or stuff the sheet with junk.
 */
export function cleanText(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  let s = input.normalize("NFC");
  // Remove control characters except newline and tab.
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  // Zero-width and bidi override characters.
  s = s.replace(/[​-‏‪-‮⁦-⁩﻿]/g, "");
  s = s.replace(/\r\n?/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/[ \t]{3,}/g, "  ");
  return s.trim().slice(0, maxLength);
}

/** Single-line variant: collapses all whitespace. */
export function cleanLine(input: unknown, maxLength: number): string {
  return cleanText(input, maxLength).replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeEmail(input: unknown): string {
  return cleanLine(input, 254).toLowerCase();
}
