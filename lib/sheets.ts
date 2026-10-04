/**
 * The ONLY module that talks to the storage backend for row data.
 *
 * It exposes simple typed functions (getAll, getById, append, updateRow,
 * transaction) over the four "tabs". Under the hood it:
 *   - converts between typed entities and string-only sheet rows,
 *   - caches reads for a few seconds (invalidated on every write),
 *   - serializes writes through a simple in-process lock.
 *
 * Swap the backend (see lib/storage) to move from Google Sheets to a real DB.
 */
import { READ_CACHE_TTL_MS } from "@/lib/config";
import { getBackend } from "@/lib/storage";
import type { Listing, LoginCode, MaterialItem, Proposal, RawRow, TabName, User } from "@/lib/types";

export interface EntityMap {
  Users: User;
  LoginCodes: LoginCode;
  Listings: Listing;
  Proposals: Proposal;
}

// ---------- codecs: typed entity <-> string row ----------

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const bool = (v: string) => v === "true" || v === "TRUE" || v === "1";
const list = (v: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

function parseMaterials(json: string): MaterialItem[] {
  try {
    const parsed = JSON.parse(json || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && typeof m === "object")
      .map((m) => ({
        name: str((m as MaterialItem).name),
        quantity: num(str((m as MaterialItem).quantity)),
        unitCostCents: num(str((m as MaterialItem).unitCostCents)),
      }));
  } catch {
    return [];
  }
}

interface Codec<T> {
  toRow(entity: Partial<T>): RawRow;
  fromRow(row: RawRow): T;
}

const codecs: { [K in TabName]: Codec<EntityMap[K]> } = {
  Users: {
    toRow: (u) => pick({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt }),
    fromRow: (r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role === "ARTIST" ? "ARTIST" : "BUSINESS",
      createdAt: r.createdAt,
    }),
  },
  LoginCodes: {
    toRow: (c) =>
      pick({
        id: c.id,
        email: c.email,
        codeHash: c.codeHash,
        expiresAt: c.expiresAt,
        used: c.used === undefined ? undefined : c.used ? "TRUE" : "FALSE",
        attempts: c.attempts,
      }),
    fromRow: (r) => ({
      id: r.id,
      email: r.email,
      codeHash: r.codeHash,
      expiresAt: r.expiresAt,
      used: bool(r.used),
      attempts: num(r.attempts),
    }),
  },
  Listings: {
    toRow: (l) =>
      pick({
        id: l.id,
        businessUserId: l.businessUserId,
        businessName: l.businessName,
        address: l.address,
        title: l.title,
        wallDescription: l.wallDescription,
        desiredWidthIn: l.desiredWidthIn,
        desiredHeightIn: l.desiredHeightIn,
        vibeDescription: l.vibeDescription,
        imageFileIds: l.imageFileIds?.join(","),
        status: l.status,
        createdAt: l.createdAt,
      }),
    fromRow: (r) => ({
      id: r.id,
      businessUserId: r.businessUserId,
      businessName: r.businessName,
      address: r.address,
      title: r.title,
      wallDescription: r.wallDescription,
      desiredWidthIn: num(r.desiredWidthIn),
      desiredHeightIn: num(r.desiredHeightIn),
      vibeDescription: r.vibeDescription,
      imageFileIds: list(r.imageFileIds),
      status: r.status === "FILLED" ? "FILLED" : r.status === "CLOSED" ? "CLOSED" : "OPEN",
      createdAt: r.createdAt,
    }),
  },
  Proposals: {
    toRow: (p) =>
      pick({
        id: p.id,
        listingId: p.listingId,
        artistUserId: p.artistUserId,
        artistName: p.artistName,
        title: p.title,
        description: p.description,
        widthIn: p.widthIn,
        heightIn: p.heightIn,
        imageFileIds: p.imageFileIds?.join(","),
        materialsJson: p.materials === undefined ? undefined : JSON.stringify(p.materials),
        materialsTotalCents: p.materialsTotalCents,
        status: p.status,
        declineReason: p.declineReason,
        createdAt: p.createdAt,
      }),
    fromRow: (r) => ({
      id: r.id,
      listingId: r.listingId,
      artistUserId: r.artistUserId,
      artistName: r.artistName,
      title: r.title,
      description: r.description,
      widthIn: num(r.widthIn),
      heightIn: num(r.heightIn),
      imageFileIds: list(r.imageFileIds),
      materials: parseMaterials(r.materialsJson),
      materialsTotalCents: num(r.materialsTotalCents),
      status: r.status === "ACCEPTED" ? "ACCEPTED" : r.status === "DECLINED" ? "DECLINED" : "SUBMITTED",
      declineReason: r.declineReason ?? "",
      createdAt: r.createdAt,
    }),
  },
};

/** Keep only defined values, stringified. */
function pick(obj: Record<string, unknown>): RawRow {
  const out: RawRow = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = str(v);
  }
  return out;
}

// ---------- read cache ----------

interface CacheEntry {
  at: number;
  rows: RawRow[];
}

declare global {
  var __freehandReadCache: Map<TabName, CacheEntry> | undefined;
  var __freehandWriteLock: Promise<unknown> | undefined;
}

const cache: Map<TabName, CacheEntry> = (globalThis.__freehandReadCache ??= new Map());

export function invalidateCache(tab?: TabName) {
  if (tab) cache.delete(tab);
  else cache.clear();
}

async function readRows(tab: TabName, fresh = false): Promise<RawRow[]> {
  const hit = cache.get(tab);
  if (!fresh && hit && Date.now() - hit.at < READ_CACHE_TTL_MS) return hit.rows;
  const backend = await getBackend();
  const rows = await backend.readAll(tab);
  cache.set(tab, { at: Date.now(), rows });
  return rows;
}

// ---------- write lock ----------

/** Run `fn` with exclusive access to writes (simple promise-chain mutex). */
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = globalThis.__freehandWriteLock ?? Promise.resolve();
  let release!: () => void;
  const mine = new Promise<void>((res) => (release = res));
  globalThis.__freehandWriteLock = prev.then(() => mine);
  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
  }
}

// ---------- public API ----------

export async function ensureSheets(): Promise<void> {
  const backend = await getBackend();
  await backend.ensureSheets();
  invalidateCache();
}

export async function getAll<K extends TabName>(tab: K, opts: { fresh?: boolean } = {}): Promise<EntityMap[K][]> {
  const rows = await readRows(tab, opts.fresh);
  return rows.map((r) => codecs[tab].fromRow(r)) as EntityMap[K][];
}

export async function getById<K extends TabName>(tab: K, id: string): Promise<EntityMap[K] | null> {
  const all = await getAll(tab);
  return (all.find((e) => e.id === id) as EntityMap[K] | undefined) ?? null;
}

export async function append<K extends TabName>(tab: K, entity: EntityMap[K]): Promise<void> {
  return withLock(() => appendUnlocked(tab, entity));
}

export async function updateRow<K extends TabName>(
  tab: K,
  id: string,
  patch: Partial<EntityMap[K]>,
): Promise<boolean> {
  return withLock(() => updateUnlocked(tab, id, patch));
}

/**
 * Transaction-ish helper: runs `fn` while holding the write lock, with fresh
 * reads, so read-modify-write sequences (like accepting a proposal) cannot
 * interleave with other writes in this process.
 */
export interface Tx {
  getAll<K extends TabName>(tab: K): Promise<EntityMap[K][]>;
  append<K extends TabName>(tab: K, entity: EntityMap[K]): Promise<void>;
  updateRow<K extends TabName>(tab: K, id: string, patch: Partial<EntityMap[K]>): Promise<boolean>;
}

export async function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return withLock(() =>
    fn({
      getAll: (tab) => getAll(tab, { fresh: true }),
      append: appendUnlocked,
      updateRow: updateUnlocked,
    }),
  );
}

async function appendUnlocked<K extends TabName>(tab: K, entity: EntityMap[K]): Promise<void> {
  const backend = await getBackend();
  const codec = codecs[tab] as Codec<EntityMap[K]>;
  await backend.appendRow(tab, codec.toRow(entity));
  invalidateCache(tab);
}

async function updateUnlocked<K extends TabName>(
  tab: K,
  id: string,
  patch: Partial<EntityMap[K]>,
): Promise<boolean> {
  const backend = await getBackend();
  const codec = codecs[tab] as Codec<EntityMap[K]>;
  const row = codec.toRow(patch);
  delete row.id; // never rewrite the key
  const ok = await backend.updateRow(tab, id, row);
  invalidateCache(tab);
  return ok;
}
