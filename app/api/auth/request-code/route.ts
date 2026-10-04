import { DEMO_MODE } from "@/lib/config";
import { issueLoginCode } from "@/lib/db";
import { handle, json, jsonError, readBody } from "@/lib/http";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { requestCodeSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const { email } = requestCodeSchema.parse(await readBody(req));
  const ip = clientIp(req);

  const perIp = checkRateLimit(`code:ip:${ip}`, 15, 15 * 60_000);
  const perEmail = checkRateLimit(`code:email:${email}`, 5, 15 * 60_000);
  if (!perIp.ok || !perEmail.ok) {
    const retry = Math.max(perIp.retryAfterSeconds, perEmail.retryAfterSeconds);
    return jsonError(429, `Too many code requests. Try again in about ${Math.ceil(retry / 60)} minute(s).`, {
      retryAfterSeconds: retry,
    });
  }

  const { code } = await issueLoginCode(email);

  // In demo mode the code is shown on screen so reviewers do not need email.
  // In every other mode the code is only ever sent through sendEmail().
  return json({ ok: true, demoCode: DEMO_MODE ? code : undefined });
});
