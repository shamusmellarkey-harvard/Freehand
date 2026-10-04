import { requireUser } from "@/lib/auth/current-user";
import { MAX_IMAGE_BYTES } from "@/lib/config";
import { handle, json, jsonError } from "@/lib/http";
import { saveImage, validateImage } from "@/lib/images";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { cleanLine } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/** Multipart upload of a single image. Returns { fileId }. Login required. */
export const POST = handle(async (req) => {
  const user = await requireUser();
  const rl = checkRateLimit(`upload:${user.id}:${clientIp(req)}`, 40, 60 * 60_000);
  if (!rl.ok) return jsonError(429, "Too many uploads. Try again later.");

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_IMAGE_BYTES + 64 * 1024) {
    return jsonError(413, `Images must be ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB or smaller.`);
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(400, "No file was uploaded.");

  const problem = validateImage(file.type, file.size);
  if (problem) return jsonError(400, problem);

  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (!sniffed || sniffed !== file.type) return jsonError(400, "That file does not look like a JPEG, PNG, or WebP image.");

  const ext = sniffed === "image/jpeg" ? "jpg" : sniffed === "image/png" ? "png" : "webp";
  const safeName = cleanLine(file.name, 60).replace(/[^A-Za-z0-9._-]/g, "_") || "image";
  const fileId = await saveImage(bytes, sniffed, `${Date.now()}-${safeName}.${ext}`);
  return json({ ok: true, fileId });
});

/** Checks magic bytes so the declared MIME type cannot be spoofed. */
function sniffImageType(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}
