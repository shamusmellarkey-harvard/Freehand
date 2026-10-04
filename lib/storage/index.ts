import { STORAGE_MODE, describeMode } from "@/lib/config";
import type { StorageBackend } from "./backend";
import { MemoryBackend } from "./memory";

declare global {
  var __freehandBackend: StorageBackend | undefined;
  var __freehandModeLogged: boolean | undefined;
}

/** Returns the process-wide storage backend, creating it on first use. */
export async function getBackend(): Promise<StorageBackend> {
  if (globalThis.__freehandBackend) return globalThis.__freehandBackend;
  let backend: StorageBackend;
  if (STORAGE_MODE === "google") {
    const { GoogleBackend } = await import("./google");
    backend = new GoogleBackend();
  } else {
    backend = new MemoryBackend();
  }
  if (!globalThis.__freehandModeLogged) {
    console.log(describeMode());
    globalThis.__freehandModeLogged = true;
  }
  globalThis.__freehandBackend = backend;
  return backend;
}
