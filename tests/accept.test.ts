import { describe, expect, it } from "vitest";
import { AUTO_DECLINE_REASON, AcceptError, computeAccept, computeDecline } from "@/lib/accept";
import type { Listing, Proposal } from "@/lib/types";

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

function proposal(id: string, status: Proposal["status"] = "SUBMITTED", listingId = "l1"): Proposal {
  return {
    id,
    listingId,
    artistUserId: `artist-${id}`,
    artistName: "Art",
    title: "Piece",
    description: "",
    widthIn: 10,
    heightIn: 10,
    imageFileIds: [],
    materials: [],
    materialsTotalCents: 0,
    status,
    declineReason: status === "DECLINED" ? "earlier reason" : "",
    createdAt: "",
  };
}

describe("computeAccept", () => {
  it("accepts the chosen proposal, fills the listing, and auto-declines the other submitted ones", () => {
    const proposals = [proposal("p1"), proposal("p2"), proposal("p3", "DECLINED"), proposal("other", "SUBMITTED", "l2")];
    const outcome = computeAccept(listing, proposals, "p1");

    expect(outcome.listingPatch).toEqual({ status: "FILLED" });
    const byId = Object.fromEntries(outcome.proposalPatches.map((p) => [p.id, p.patch]));
    expect(byId.p1).toEqual({ status: "ACCEPTED", declineReason: "" });
    expect(byId.p2).toEqual({ status: "DECLINED", declineReason: AUTO_DECLINE_REASON });
    // Already-declined proposals keep their original reason (not patched).
    expect(byId.p3).toBeUndefined();
    // Proposals for other listings are untouched.
    expect(byId.other).toBeUndefined();
  });

  it("refuses when the listing is not open", () => {
    expect(() => computeAccept({ ...listing, status: "FILLED" }, [proposal("p1")], "p1")).toThrowError(AcceptError);
    try {
      computeAccept({ ...listing, status: "CLOSED" }, [proposal("p1")], "p1");
    } catch (e) {
      expect((e as AcceptError).code).toBe("LISTING_NOT_OPEN");
    }
  });

  it("refuses unknown proposals or proposals from another listing", () => {
    expect(() => computeAccept(listing, [proposal("p1")], "nope")).toThrowError(/not found/i);
    expect(() => computeAccept(listing, [proposal("p9", "SUBMITTED", "l2")], "p9")).toThrowError(/not found/i);
  });

  it("refuses proposals that are not in SUBMITTED state", () => {
    try {
      computeAccept(listing, [proposal("p1", "DECLINED")], "p1");
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as AcceptError).code).toBe("PROPOSAL_NOT_SUBMITTED");
    }
  });

  it("works with a single proposal (nothing else to decline)", () => {
    const outcome = computeAccept(listing, [proposal("p1")], "p1");
    expect(outcome.proposalPatches).toHaveLength(1);
    expect(outcome.proposalPatches[0]).toEqual({ id: "p1", patch: { status: "ACCEPTED", declineReason: "" } });
  });
});

describe("computeDecline", () => {
  it("declines with the given reason", () => {
    expect(computeDecline(listing, proposal("p1"), "Not quite the vibe").proposalPatch).toEqual({
      status: "DECLINED",
      declineReason: "Not quite the vibe",
    });
  });

  it("allows an empty reason", () => {
    expect(computeDecline(listing, proposal("p1"), "").proposalPatch.declineReason).toBe("");
  });

  it("refuses to decline something already decided", () => {
    expect(() => computeDecline(listing, proposal("p1", "ACCEPTED"), "")).toThrowError(AcceptError);
    expect(() => computeDecline(listing, proposal("p1", "DECLINED"), "")).toThrowError(AcceptError);
  });

  it("refuses a proposal for another listing", () => {
    expect(() => computeDecline(listing, proposal("p1", "SUBMITTED", "l2"), "")).toThrowError(/not found/i);
  });
});
