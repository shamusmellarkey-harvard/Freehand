import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { IS_VERCEL, LOCAL_DATA_DIR } from "@/lib/config";
import { TAB_HEADERS, TAB_NAMES, type RawRow, type TabName } from "@/lib/types";
import type { StorageBackend } from "./backend";

/**
 * In-memory backend used when Google credentials are missing.
 *
 * Locally it persists to `.data/db.json` and `.data/images/` so data survives
 * restarts. On Vercel the filesystem is read-only, so data lives only in
 * memory and resets on cold starts.
 */

interface MemoryState {
  tabs: Record<TabName, RawRow[]>;
  images: Record<string, { mimeType: string; data: Buffer }>;
}

interface PersistedState {
  tabs: Record<TabName, RawRow[]>;
  images: Record<string, { mimeType: string; file: string }>;
}

declare global {
  var __freehandMemoryState: MemoryState | undefined;
}

function emptyTabs(): Record<TabName, RawRow[]> {
  return { Users: [], LoginCodes: [], Listings: [], Proposals: [] };
}

export class MemoryBackend implements StorageBackend {
  readonly name: string;
  private state: MemoryState;
  private readonly persist: boolean;
  private readonly dataDir: string;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), LOCAL_DATA_DIR);
    this.persist = !IS_VERCEL && canWrite(this.dataDir);
    this.name = this.persist ? `local JSON (${LOCAL_DATA_DIR})` : "in-memory";

    if (globalThis.__freehandMemoryState) {
      this.state = globalThis.__freehandMemoryState;
    } else {
      this.state = { tabs: emptyTabs(), images: {} };
      if (this.persist) this.load();
      globalThis.__freehandMemoryState = this.state;
    }
  }

  async ensureSheets(): Promise<void> {
    for (const tab of TAB_NAMES) {
      if (!this.state.tabs[tab]) this.state.tabs[tab] = [];
    }
  }

  async readAll(tab: TabName): Promise<RawRow[]> {
    // Return copies so callers cannot mutate the store.
    return this.state.tabs[tab].map((r) => ({ ...r }));
  }

  async appendRow(tab: TabName, row: RawRow): Promise<void> {
    const headers = TAB_HEADERS[tab];
    const clean: RawRow = {};
    for (const h of headers) clean[h] = row[h] ?? "";
    this.state.tabs[tab].push(clean);
    this.scheduleSave();
  }

  async updateRow(tab: TabName, id: string, patch: RawRow): Promise<boolean> {
    const rows = this.state.tabs[tab];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows[idx] = { ...rows[idx], ...patch };
    this.scheduleSave();
    return true;
  }

  async putImage(data: Buffer, mimeType: string): Promise<string> {
    const id = "img_" + randomUUID().replace(/-/g, "").slice(0, 20);
    this.state.images[id] = { mimeType, data };
    if (this.persist) {
      try {
        const dir = path.join(this.dataDir, "images");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, id), data);
      } catch (err) {
        console.warn("[freehand] could not persist image to disk:", err);
      }
    }
    this.scheduleSave();
    return id;
  }

  async getImage(fileId: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const img = this.state.images[fileId];
    return img ? { data: img.data, mimeType: img.mimeType } : null;
  }

  // ---- persistence helpers ----

  private load() {
    try {
      const file = path.join(this.dataDir, "db.json");
      if (!fs.existsSync(file)) return;
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as PersistedState;
      for (const tab of TAB_NAMES) {
        this.state.tabs[tab] = Array.isArray(parsed.tabs?.[tab]) ? parsed.tabs[tab] : [];
      }
      for (const [id, meta] of Object.entries(parsed.images ?? {})) {
        const p = path.join(this.dataDir, "images", meta.file);
        if (fs.existsSync(p)) {
          this.state.images[id] = { mimeType: meta.mimeType, data: fs.readFileSync(p) };
        }
      }
    } catch (err) {
      console.warn("[freehand] could not load local data; starting fresh:", err);
    }
  }

  private scheduleSave() {
    if (!this.persist) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 150);
  }

  private save() {
    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
      const persisted: PersistedState = {
        tabs: this.state.tabs,
        images: Object.fromEntries(
          Object.entries(this.state.images).map(([id, img]) => [id, { mimeType: img.mimeType, file: id }]),
        ),
      };
      const file = path.join(this.dataDir, "db.json");
      fs.writeFileSync(file + ".tmp", JSON.stringify(persisted, null, 2));
      fs.renameSync(file + ".tmp", file);
    } catch (err) {
      console.warn("[freehand] could not save local data:", err);
    }
  }
}

function canWrite(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
