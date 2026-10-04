import { describeFailure } from "@/lib/auth/codes";
import { setPendingCookie, setSessionCookie } from "@/lib/auth/session";
import { getUserByEmail, verifyCode } from "@/lib/db";
import { handle, json, jsonError, readBody } from "@/lib/http";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { verifyCodeSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const { email, code } = verifyCodeSchema.parse(await readBody(req));
  const ip = clientIp(req);
  const rl = checkRateLimit(`verify:ip:${ip}`, 30, 15 * 60_000);
  if (!rl.ok) return jsonError(429, "Too many attempts. Please wait a few minutes.");

  const result = await verifyCode(email, code);
  if (!result.ok) {
    const message =
      result.reason === "no_code" ? "No active code for that email. Request a new one." : describeFailure(result.reason);
    return jsonError(400, message, { reason: result.reason });
  }

  const user = await getUserByEmail(email);
  if (user) {
    await setSessionCookie(user.id);
    return json({ ok: true, status: "ok" as const });
  }
  await setPendingCookie(email);
  return json({ ok: true, status: "new" as const });
});
