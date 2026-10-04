/**
 * Image storage facade. Images are stored in Google Drive (google mode) or in
 * memory / on local disk (local mode). Seed images are static SVGs in
 * `public/demo/` and use ids prefixed with `demo-`.
 */
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/config";
import { getBackend } from "@/lib/storage";

export const DEMO_IMAGE_PREFIX = "demo-";

export function isDemoImageId(fileId: string): boolean {
  return fileId.startsWith(DEMO_IMAGE_PREFIX);
}

/** URL the browser should use to display an image by file id. */
export function imageUrl(fileId: string): string {
  if (isDemoImageId(fileId)) return `/demo/${fileId.slice(DEMO_IMAGE_PREFIX.length)}.svg`;
  return `/api/images/${encodeURIComponent(fileId)}`;
}

export function validateImage(mimeType: string, size: number): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return "Only JPEG, PNG, or WebP images are allowed.";
  }
  if (size <= 0) return "The file is empty.";
  if (size > MAX_IMAGE_BYTES) {
    return `Images must be ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB or smaller.`;
  }
  return null;
}

export async function saveImage(data: Buffer, mimeType: string, fileName: string): Promise<string> {
  const backend = await getBackend();
  return backend.putImage(data, mimeType, fileName);
}

export async function readImage(fileId: string): Promise<{ data: Buffer; mimeType: string } | null> {
  const backend = await getBackend();
  return backend.getImage(fileId);
}
