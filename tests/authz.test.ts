import { describe, expect, it } from "vitest";
import { canCreateListing, canCreateProposal, canManageProposals, canSeeContact, isListingOwner } from "@/lib/authz";
import type { Listing, Proposal, User } from "@/lib/types";

const biz: User = { id: "b1", email: "b@example.com", name: "Biz", role: "BUSINESS", createdAt: "" };
const otherBiz: User = { id: "b2", email: "b2@example.com", name: "Biz 2", role: "BUSINESS", createdAt: "" };
const artist: User = { id: "a1", email: "a@example.com", name: "Art", role: "ARTIST", createdAt: "" };
const otherArtist: User = { id: "a2", email: "a2@example.com", name: "Art 2", role: "ARTIST", createdAt: "" };

const listing: Listing = {
  id: "l1",
  businessUserId: "b1",
  businessName: "Biz",
  address: "1 Main St",
  title: "Wall",
  wallDescription: "",
  desiredWidthIn: 10,
  desiredHeightIn: 10,
  vibeDescription: "",
  imageFileIds: [],
  status: "OPEN",
  createdAt: "",
};

const proposal: Proposal = {
  id: "p1",
  listingId: "l1",
  artistUserId: "a1",
  artistName: "Art",
  title: "Piece",
  description: "",
  widthIn: 10,
  heightIn: 10,
  imageFileIds: [],
  materials: [],
  materialsTotalCents: 0,
  status: "SUBMITTED",
  declineReason: "",
  createdAt: "",
};

describe("authorization helpers", () => {
  it("only businesses can create listings", () => {
    expect(canCreateListing(biz)).toBe(true);
    expect(canCreateListing(artist)).toBe(false);
    expect(canCreateListing(null)).toBe(false);
  });

  it("only artists can propose, once, and only to open listings", () => {
    expect(canCreateProposal(artist, listing, [])).toBe(true);
    expect(canCreateProposal(biz, listing, [])).toBe(false);
    expect(canCreateProposal(null, listing, [])).toBe(false);
    expect(canCreateProposal(artist, listing, [proposal])).toBe(false);
    expect(canCreateProposal(otherArtist, listing, [proposal])).toBe(true);
    expect(canCreateProposal(artist, { ...listing, status: "FILLED" }, [])).toBe(false);
  });

  it("only the owner manages a listing's proposals", () => {
    expect(isListingOwner(biz, listing)).toBe(true);
    expect(canManageProposals(biz, listing)).toBe(true);
    expect(canManageProposals(otherBiz, listing)).toBe(false);
    expect(canManageProposals(artist, listing)).toBe(false);
    expect(canManageProposals(null, listing)).toBe(false);
  });

  it("reveals contact only on accepted proposals, only to the two parties", () => {
    expect(canSeeContact(biz, listing, proposal)).toBe(false); // not accepted yet
    const accepted = { ...proposal, status: "ACCEPTED" as const };
    expect(canSeeContact(biz, listing, accepted)).toBe(true);
    expect(canSeeContact(artist, listing, accepted)).toBe(true);
    expect(canSeeContact(otherBiz, listing, accepted)).toBe(false);
    expect(canSeeContact(otherArtist, listing, accepted)).toBe(false);
    expect(canSeeContact(null, listing, accepted)).toBe(false);
  });
});
