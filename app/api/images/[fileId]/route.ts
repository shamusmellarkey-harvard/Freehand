import { isImageReferenced } from "@/lib/db";
import { isDemoImageId, readImage } from "@/lib/images";

export const dynamic = "force-dynamic";

/**
 * Streams an image from storage. Drive files are never made public; this
 * proxy only serves file ids that a listing or proposal references.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(fileId)) return new Response("Not found", { status: 404 });
  if (isDemoImageId(fileId)) {
    // Seed images are static files under /public/demo.
    return Response.redirect(new URL(`/demo/${fileId.slice(5)}.svg`, _req.url), 302);
  }
  if (!(await isImageReferenced(fileId))) return new Response("Not found", { status: 404 });

  try {
    const img = await readImage(fileId);
    if (!img) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(img.data), {
      headers: {
        "Content-Type": img.mimeType,
        "Content-Length": String(img.data.length),
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[freehand] image proxy error:", err);
    return new Response("Image unavailable", { status: 502 });
  }
}
