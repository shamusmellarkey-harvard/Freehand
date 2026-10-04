import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { handle, json, readBody, safeRedirectPath, wantsHtml } from "@/lib/http";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const body = await readBody(req);
  await clearSessionCookie();
  if (wantsHtml(req)) {
    return NextResponse.redirect(new URL(safeRedirectPath(body.redirectTo, "/"), req.url), { status: 303 });
  }
  return json({ ok: true });
});
