/**
 * Creates the Google Sheet tabs and header rows.
 * Usage: npm run setup-sheets   (reads .env.local / .env)
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: false });

async function main() {
  const { HAS_GOOGLE_CREDENTIALS, GOOGLE_SHEET_ID } = await import("@/lib/config");
  if (!HAS_GOOGLE_CREDENTIALS) {
    console.error(
      "Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID and GOOGLE_DRIVE_FOLDER_ID in .env.local first.",
    );
    process.exit(1);
  }
  const { ensureSheets } = await import("@/lib/sheets");
  console.log(`Ensuring tabs + headers exist in spreadsheet ${GOOGLE_SHEET_ID} ...`);
  await ensureSheets();
  console.log("Done. Tabs: Users, LoginCodes, Listings, Proposals.");
}

main().catch((err) => {
  console.error("setup-sheets failed:", err?.message ?? err);
  process.exit(1);
});
