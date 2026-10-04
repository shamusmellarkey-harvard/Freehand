import type { Listing, Proposal } from "@/lib/types";

export const AUTO_DECLINE_REASON =
  "Thanks so much for responding. The business chose another proposal for this wall, so this one was closed automatically. We hope you will respond to other walls on Freehand.";

export interface AcceptOutcome {
  listingPatch: Pick<Listing, "status">;
  proposalPatches: { id: string; patch: Pick<Proposal, "status" | "declineReason"> }[];
}

export class AcceptError extends Error {
  constructor(
    message: string,
    public readonly code: "LISTING_NOT_OPEN" | "PROPOSAL_NOT_FOUND" | "PROPOSAL_NOT_SUBMITTED",
  ) {
    super(message);
  }
}

/**
 * Pure accept logic. Given a listing and all of its proposals, computes the
 * updates needed to accept `acceptedProposalId`:
 *   - that proposal becomes ACCEPTED,
 *   - the listing becomes FILLED,
 *   - every other SUBMITTED proposal becomes DECLINED with a polite reason.
 * Throws AcceptError if the state does not allow it.
 */
export function computeAccept(listing: Listing, proposals: Proposal[], acceptedProposalId: string): AcceptOutcome {
  if (listing.status !== "OPEN") {
    throw new AcceptError("This wall is no longer open.", "LISTING_NOT_OPEN");
  }
  const target = proposals.find((p) => p.id === acceptedProposalId && p.listingId === listing.id);
  if (!target) {
    throw new AcceptError("Proposal not found for this wall.", "PROPOSAL_NOT_FOUND");
  }
  if (target.status !== "SUBMITTED") {
    throw new AcceptError("Only submitted proposals can be accepted.", "PROPOSAL_NOT_SUBMITTED");
  }
  const proposalPatches: AcceptOutcome["proposalPatches"] = [
    { id: target.id, patch: { status: "ACCEPTED", declineReason: "" } },
  ];
  for (const p of proposals) {
    if (p.listingId !== listing.id || p.id === target.id) continue;
    if (p.status === "SUBMITTED") {
      proposalPatches.push({ id: p.id, patch: { status: "DECLINED", declineReason: AUTO_DECLINE_REASON } });
    }
  }
  return { listingPatch: { status: "FILLED" }, proposalPatches };
}

export interface DeclineOutcome {
  proposalPatch: Pick<Proposal, "status" | "declineReason">;
}

export function computeDecline(listing: Listing, proposal: Proposal, reason: string): DeclineOutcome {
  if (proposal.listingId !== listing.id) {
    throw new AcceptError("Proposal not found for this wall.", "PROPOSAL_NOT_FOUND");
  }
  if (proposal.status !== "SUBMITTED") {
    throw new AcceptError("Only submitted proposals can be declined.", "PROPOSAL_NOT_SUBMITTED");
  }
  return { proposalPatch: { status: "DECLINED", declineReason: reason } };
}
