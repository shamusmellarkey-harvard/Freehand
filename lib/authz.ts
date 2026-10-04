import type { Listing, Proposal, User } from "@/lib/types";

type Viewer = Pick<User, "id" | "role"> | null | undefined;

export function canCreateListing(user: Viewer): boolean {
  return !!user && user.role === "BUSINESS";
}

export function canCreateProposal(user: Viewer, listing: Listing, existing: Proposal[]): boolean {
  if (!user || user.role !== "ARTIST") return false;
  if (listing.status !== "OPEN") return false;
  return !existing.some((p) => p.listingId === listing.id && p.artistUserId === user.id);
}

export function isListingOwner(user: Viewer, listing: Listing): boolean {
  return !!user && user.id === listing.businessUserId;
}

export function canManageProposals(user: Viewer, listing: Listing): boolean {
  return isListingOwner(user, listing);
}

export function canViewProposal(user: Viewer, listing: Listing, proposal: Proposal): boolean {
  if (!user) return false;
  return isListingOwner(user, listing) || proposal.artistUserId === user.id;
}

/**
 * Contact details are revealed only on ACCEPTED proposals, and only to the
 * two parties involved (the listing owner and the proposal's artist).
 */
export function canSeeContact(user: Viewer, listing: Listing, proposal: Proposal): boolean {
  if (proposal.status !== "ACCEPTED") return false;
  return canViewProposal(user, listing, proposal);
}
