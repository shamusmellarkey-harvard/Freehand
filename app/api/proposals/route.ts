import { requireUser } from "@/lib/auth/current-user";
import { canCreateProposal } from "@/lib/authz";
import { MAX_PROPOSALS_PER_USER_PER_DAY, MAX_TOTAL_PROPOSALS } from "@/lib/config";
import { countAll, countRecentByUser, createProposal, getListing, listProposalsForListing } from "@/lib/db";
import { handle, json, jsonError, readBody } from "@/lib/http";
import { materialsTotalCents } from "@/lib/materials";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createProposalSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60_000;

export const POST = handle(async (req) => {
  const user = await requireUser("ARTIST");
  const rl = checkRateLimit(`write:${clientIp(req)}`, 30, 60 * 60_000);
  if (!rl.ok) return jsonError(429, "You are doing that too often. Please slow down.");

  const input = createProposalSchema.parse(await readBody(req));

  const listing = await getListing(input.listingId);
  if (!listing) return jsonError(404, "That wall no longer exists.");
  const existing = await listProposalsForListing(listing.id);
  if (!canCreateProposal(user, listing, existing)) {
    return jsonError(409, listing.status !== "OPEN" ? "That wall is no longer open." : "You already responded to this wall.");
  }

  if ((await countAll("Proposals")) >= MAX_TOTAL_PROPOSALS) {
    return jsonError(503, "The demo has reached its proposal limit. Please try again later.");
  }
  if ((await countRecentByUser("Proposals", user.id, DAY)) >= MAX_PROPOSALS_PER_USER_PER_DAY) {
    return jsonError(429, "This account has sent the maximum number of responses for today.");
  }

  const proposal = await createProposal({
    listingId: listing.id,
    artistUserId: user.id,
    artistName: user.name,
    title: input.title,
    description: input.description,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    imageFileIds: input.imageFileIds,
    materials: input.materials,
    materialsTotalCents: materialsTotalCents(input.materials),
  });
  return json({ ok: true, id: proposal.id }, { status: 201 });
});
