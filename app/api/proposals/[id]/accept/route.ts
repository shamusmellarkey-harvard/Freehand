import { requireUser } from "@/lib/auth/current-user";
import { canManageProposals } from "@/lib/authz";
import { acceptProposal, getListing, getProposal } from "@/lib/db";
import { handle, json, jsonError } from "@/lib/http";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const POST = handle(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser("BUSINESS");
  const rl = checkRateLimit(`write:${clientIp(req)}`, 30, 60 * 60_000);
  if (!rl.ok) return jsonError(429, "You are doing that too often. Please slow down.");

  const { id } = await ctx.params;
  const proposal = await getProposal(id);
  if (!proposal) return jsonError(404, "Proposal not found.");
  const listing = await getListing(proposal.listingId);
  if (!listing) return jsonError(404, "Wall not found.");
  if (!canManageProposals(user, listing)) return jsonError(403, "Only the owner of this wall can accept proposals.");

  await acceptProposal(listing.id, proposal.id);
  return json({ ok: true });
});
