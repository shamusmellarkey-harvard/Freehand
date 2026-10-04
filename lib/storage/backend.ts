import type { RawRow, TabName } from "@/lib/types";

/**
 * A storage backend provides raw, string-only row access for each tab plus
 * binary blob storage for images. `lib/sheets.ts` and `lib/images.ts` are the
 * only modules that talk to a backend.
 */
export interface StorageBackend {
  readonly name: string;
  /** Create tabs + header rows if missing. Safe to call repeatedly. */
  ensureSheets(): Promise<void>;
  readAll(tab: TabName): Promise<RawRow[]>;
  appendRow(tab: TabName, row: RawRow): Promise<void>;
  /** Update the row whose `id` column matches. Resolves false if not found. */
  updateRow(tab: TabName, id: string, patch: RawRow): Promise<boolean>;

  putImage(data: Buffer, mimeType: string, fileName: string): Promise<string>;
  getImage(fileId: string): Promise<{ data: Buffer; mimeType: string } | null>;
}
