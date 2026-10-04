import { getPendingEmail, setSessionCookie } from "@/lib/auth/session";
import { createUser } from "@/lib/db";
import { handle, json, jsonError, readBody } from "@/lib/http";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { completeProfileSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const { name, role } = completeProfileSchema.parse(await readBody(req));
  const email = await getPendingEmail();
  if (!email) return jsonError(401, "Your verification expired. Please log in again.");
  const rl = checkRateLimit(`signup:ip:${clientIp(req)}`, 10, 60 * 60_000);
  if (!rl.ok) return jsonError(429, "Too many sign-ups from this network. Try again later.");

  const user = await createUser({ email, name, role });
  await setSessionCookie(user.id);
  return json({ ok: true, role: user.role });
});
