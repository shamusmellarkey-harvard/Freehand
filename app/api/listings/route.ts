import { requireUser } from "@/lib/auth/current-user";
import { canCreateListing } from "@/lib/authz";
import { MAX_LISTINGS_PER_USER_PER_DAY, MAX_TOTAL_LISTINGS } from "@/lib/config";
import { countAll, countRecentByUser, createListing } from "@/lib/db";
import { handle, json, jsonError, readBody } from "@/lib/http";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createListingSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60_000;

export const POST = handle(async (req) => {
  const user = await requireUser("BUSINESS");
  if (!canCreateListing(user)) return jsonError(403, "Only business accounts can post walls.");

  const rl = checkRateLimit(`write:${clientIp(req)}`, 30, 60 * 60_000);
  if (!rl.ok) return jsonError(429, "You are doing that too often. Please slow down.");

  const input = createListingSchema.parse(await readBody(req));

  if ((await countAll("Listings")) >= MAX_TOTAL_LISTINGS) {
    return jsonError(503, "The demo has reached its listing limit. Please try again later.");
  }
  if ((await countRecentByUser("Listings", user.id, DAY)) >= MAX_LISTINGS_PER_USER_PER_DAY) {
    return jsonError(429, "This account has posted the maximum number of walls for today.");
  }

  const listing = await createListing({ ...input, businessUserId: user.id });
  return json({ ok: true, id: listing.id }, { status: 201 });
});
