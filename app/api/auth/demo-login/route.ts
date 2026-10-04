import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { DEMO_MODE } from "@/lib/config";
import { getUserById, isDemoUserId } from "@/lib/db";
import { handle, json, jsonError, readBody, safeRedirectPath, wantsHtml } from "@/lib/http";
import { demoLoginSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * One-click login as a seeded demo user. Only available in demo mode.
 * Accepts JSON or a plain HTML form post (so header buttons work without JS).
 */
export const POST = handle(async (req) => {
  if (!DEMO_MODE) return jsonError(404, "Demo login is disabled.");
  const body = await readBody(req);
  const { userId } = demoLoginSchema.parse(body);
  if (!isDemoUserId(userId)) return jsonError(400, "Unknown demo user.");
  const user = await getUserById(userId);
  if (!user) return jsonError(404, "Demo user not found. The data may have reset; reload the page.");

  await setSessionCookie(user.id);

  if (wantsHtml(req)) {
    const to = safeRedirectPath(body.redirectTo, "/account");
    return NextResponse.redirect(new URL(to, req.url), { status: 303 });
  }
  return json({ ok: true, role: user.role });
});
