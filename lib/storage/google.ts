import { google, type sheets_v4, type drive_v3 } from "googleapis";
import { Readable } from "node:stream";
import {
  GOOGLE_DRIVE_FOLDER_ID,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_SHEET_ID,
} from "@/lib/config";
import { TAB_HEADERS, TAB_NAMES, type RawRow, type TabName } from "@/lib/types";
import type { StorageBackend } from "./backend";

/**
 * Google Sheets (rows) + Google Drive (images) backend, authenticated with a
 * service account. The spreadsheet and the Drive folder must be shared with
 * the service account's email address.
 */
export class GoogleBackend implements StorageBackend {
  readonly name = "Google Sheets + Drive";
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;
  private spreadsheetId: string;
  private folderId: string;

  constructor() {
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID || !GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error("Google credentials are not fully configured");
    }
    const auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
    });
    this.sheets = google.sheets({ version: "v4", auth });
    this.drive = google.drive({ version: "v3", auth });
    this.spreadsheetId = GOOGLE_SHEET_ID;
    this.folderId = GOOGLE_DRIVE_FOLDER_ID;
  }

  async ensureSheets(): Promise<void> {
    const meta = await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    const existing = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title ?? ""));
    const missing = TAB_NAMES.filter((t) => !existing.has(t));
    if (missing.length) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) },
      });
    }
    for (const tab of TAB_NAMES) {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${tab}!1:1`,
      });
      const header = res.data.values?.[0] ?? [];
      if (header.length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${tab}!A1`,
          valueInputOption: "RAW",
          requestBody: { values: [[...TAB_HEADERS[tab]]] },
        });
      }
    }
  }

  private async readRaw(tab: TabName): Promise<{ header: string[]; rows: string[][] }> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A:Z`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const values = (res.data.values ?? []) as unknown[][];
    const header = (values[0] ?? [...TAB_HEADERS[tab]]).map(String);
    const rows = values.slice(1).map((r) => r.map((c) => (c === null || c === undefined ? "" : String(c))));
    return { header, rows };
  }

  async readAll(tab: TabName): Promise<RawRow[]> {
    const { header, rows } = await this.readRaw(tab);
    return rows
      .filter((r) => r.some((c) => c !== ""))
      .map((r) => {
        const obj: RawRow = {};
        header.forEach((h, i) => (obj[h] = r[i] ?? ""));
        return obj;
      });
  }

  async appendRow(tab: TabName, row: RawRow): Promise<void> {
    const values = TAB_HEADERS[tab].map((h) => row[h] ?? "");
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
  }

  async updateRow(tab: TabName, id: string, patch: RawRow): Promise<boolean> {
    const { header, rows } = await this.readRaw(tab);
    const idCol = header.indexOf("id");
    const idx = rows.findIndex((r) => r[idCol] === id);
    if (idx === -1) return false;
    const current: RawRow = {};
    header.forEach((h, i) => (current[h] = rows[idx][i] ?? ""));
    const merged = { ...current, ...patch };
    const values = header.map((h) => merged[h] ?? "");
    const sheetRow = idx + 2; // 1-based, plus header row
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A${sheetRow}:${columnLetter(header.length)}${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [values] },
    });
    return true;
  }

  async putImage(data: Buffer, mimeType: string, fileName: string): Promise<string> {
    const res = await this.drive.files.create({
      requestBody: { name: fileName, parents: [this.folderId] },
      media: { mimeType, body: Readable.from(data) },
      fields: "id",
      supportsAllDrives: true,
    });
    if (!res.data.id) throw new Error("Drive upload returned no file id");
    return res.data.id;
  }

  async getImage(fileId: string): Promise<{ data: Buffer; mimeType: string } | null> {
    try {
      const meta = await this.drive.files.get({ fileId, fields: "mimeType", supportsAllDrives: true });
      const file = await this.drive.files.get(
        { fileId, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" },
      );
      return {
        data: Buffer.from(file.data as ArrayBuffer),
        mimeType: meta.data.mimeType ?? "application/octet-stream",
      };
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      if (code === 404) return null;
      throw err;
    }
  }
}

function columnLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
