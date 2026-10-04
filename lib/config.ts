/**
 * Runtime configuration and mode detection.
 *
 * - STORAGE_MODE "google": Google Sheets + Drive via a service account.
 * - STORAGE_MODE "local":  in-memory store (persisted to .data/ when the
 *   filesystem is writable, i.e. local dev). Used whenever Google
 *   credentials are missing.
 * - DEMO_MODE: shows login codes on screen, enables one-click demo users,
 *   loads seed data. Defaults to true when Google credentials are missing.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v : undefined;
}

export const GOOGLE_SERVICE_ACCOUNT_EMAIL = env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
export const GOOGLE_PRIVATE_KEY = env("GOOGLE_PRIVATE_KEY")?.replace(/\n/g, "\n");
export const GOOGLE_SHEET_ID = env("GOOGLE_SHEET_ID");
export const GOOGLE_DRIVE_FOLDER_ID = env("GOOGLE_DRIVE_FOLDER_ID");

export const HAS_GOOGLE_CREDENTIALS = Boolean(
  GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_SHEET_ID && GOOGLE_DRIVE_FOLDER_ID,
);

export type StorageMode = "google" | "local";
export const STORAGE_MODE: StorageMode = HAS_GOOGLE_CREDENTIALS ? "google" : "local";

const demoEnv = env("DEMO_MODE");
export const DEMO_MODE: boolean = demoEnv !== undefined ? demoEnv.toLowerCase() === "true" : !HAS_GOOGLE_CREDENTIALS;

export const IS_VERCEL = Boolean(env("VERCEL"));

/** Secret used to sign session JWTs and hash login codes. */
export const AUTH_SECRET: string =
  env("AUTH_SECRET") ?? "dev-only-insecure-secret-change-me-please-0123456789";
export const AUTH_SECRET_IS_DEFAULT = !env("AUTH_SECRET");

export const SESSION_COOKIE = "fh_session";
export const PENDING_COOKIE = "fh_pending";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const PENDING_TTL_SECONDS = 60 * 15; // 15 minutes to finish profile

/** Image upload limits. */
export const MAX_IMAGE_BYTES = STORAGE_MODE === "google" ? 8 * 1024 * 1024 : 2 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Read cache TTL for the data layer. */
export const READ_CACHE_TTL_MS = 15_000;

/** Demo safety caps. */
export const MAX_TOTAL_LISTINGS = 300;
export const MAX_TOTAL_PROPOSALS = 600;
export const MAX_LISTINGS_PER_USER_PER_DAY = 10;
export const MAX_PROPOSALS_PER_USER_PER_DAY = 20;

/** Local data directory for the local storage mode. */
export const LOCAL_DATA_DIR = env("LOCAL_DATA_DIR") ?? ".data";

export function describeMode(): string {
  const storage =
    STORAGE_MODE === "google"
      ? "Google Sheets + Drive (service account)"
      : IS_VERCEL
        ? "in-memory (resets on cold start; no Google credentials found)"
        : `local JSON file in ./${LOCAL_DATA_DIR} (no Google credentials found)`;
  return `[freehand] storage: ${storage} | demo mode: ${DEMO_MODE ? "ON" : "off"}${
    AUTH_SECRET_IS_DEFAULT ? " | AUTH_SECRET: using insecure default (set AUTH_SECRET in production)" : ""
  }`;
}
