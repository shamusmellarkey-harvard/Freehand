/**
 * Application data access: typed, domain-level functions built on
 * `lib/sheets.ts`. Handles first-run setup (ensureSheets + demo seeding).
 */
import { randomUUID } from "node:crypto";
import { AcceptError, computeAccept, computeDecline } from "@/lib/accept";
import { createLoginCode, latestActiveCode, verifyLoginCode, type VerifyFailure } from "@/lib/auth/codes";
import { canSeeContact } from "@/lib/authz";
import { AUTH_SECRET, DEMO_MODE } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { SEED_LISTINGS, SEED_PROPOSALS, SEED_USERS } from "@/lib/seed";
import * as sheets from "@/lib/sheets";
import type { ContactInfo, Listing, Proposal, PublicUser, Role, User } from "@/lib/types";

declare global {
  var __freehandInit: Promise<void> | undefined;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

/** Ensures tabs exist and, in demo mode, seeds data once when Users is empty. */
export async function init(): Promise<void> {
  if (!globalThis.__freehandInit) {
    globalThis.__freehandInit = (async () => {
      await sheets.ensureSheets();
      if (!DEMO_MODE) return;
      await sheets.transaction(async (tx) => {
        const users = await tx.getAll("Users");
        if (users.length > 0) return;
        console.log("[freehand] demo mode: loading seed data");
        for (const u of SEED_USERS) await tx.append("Users", u);
        for (const l of SEED_LISTINGS) await tx.append("Listings", l);
        for (const p of SEED_PROPOSALS) await tx.append("Proposals", p);
      });
    })().catch((err) => {
      globalThis.__freehandInit = undefined; // allow retry on next request
      throw err;
    });
  }
  return globalThis.__freehandInit;
}

// ---------- users ----------

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, name: u.name, role: u.role };
}

export async function getUserById(id: string): Promise<User | null> {
  await init();
  return sheets.getById("Users", id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await init();
  const users = await sheets.getAll("Users");
  const e = email.toLowerCase();
  return users.find((u) => u.email.toLowerCase() === e) ?? null;
}

export async function createUser(input: { email: string; name: string; role: Role }): Promise<User> {
  await init();
  return sheets.transaction(async (tx) => {
    const users = await tx.getAll("Users");
    const existing = users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) return existing;
    const user: User = {
      id: newId("u"),
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
      createdAt: new Date().toISOString(),
    };
    await tx.append("Users", user);
    return user;
  });
}

export async function getDemoUsers(): Promise<PublicUser[]> {
  await init();
  const users = await sheets.getAll("Users");
  const seedIds = new Set(SEED_USERS.map((u) => u.id));
  return users.filter((u) => seedIds.has(u.id)).map(toPublicUser);
}

export function isDemoUserId(id: string): boolean {
  return SEED_USERS.some((u) => u.id === id);
}

// ---------- login codes ----------

export async function issueLoginCode(email: string): Promise<{ code: string }> {
  await init();
  const { code, record } = createLoginCode({ email, secret: AUTH_SECRET });
  await sheets.append("LoginCodes", record);
  await sendEmail(
    email,
    "Your Freehand login code",
    `Your one-time login code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`,
  );
  return { code };
}

export async function verifyCode(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; reason: VerifyFailure | "no_code" }> {
  await init();
  return sheets.transaction(async (tx) => {
    const records = await tx.getAll("LoginCodes");
    const record = latestActiveCode(records, email);
    if (!record) return { ok: false, reason: "no_code" as const };
    const result = verifyLoginCode(record, code, AUTH_SECRET);
    await tx.updateRow("LoginCodes", record.id, { attempts: result.record.attempts, used: result.record.used });
    return result.ok ? { ok: true as const } : { ok: false as const, reason: result.reason };
  });
}

// ---------- listings ----------

export async function listOpenListings(): Promise<Listing[]> {
  await init();
  const all = await sheets.getAll("Listings");
  return all.filter((l) => l.status === "OPEN").sort(byNewest);
}

export async function listAllListings(): Promise<Listing[]> {
  await init();
  return sheets.getAll("Listings");
}

export async function getListing(id: string): Promise<Listing | null> {
  await init();
  return sheets.getById("Listings", id);
}

export async function listListingsByOwner(userId: string): Promise<Listing[]> {
  await init();
  const all = await sheets.getAll("Listings");
  return all.filter((l) => l.businessUserId === userId).sort(byNewest);
}

export async function createListing(
  input: Omit<Listing, "id" | "status" | "createdAt">,
): Promise<Listing> {
  await init();
  const listing: Listing = { ...input, id: newId("l"), status: "OPEN", createdAt: new Date().toISOString() };
  await sheets.append("Listings", listing);
  return listing;
}

// ---------- proposals ----------

export async function listProposalsForListing(listingId: string): Promise<Proposal[]> {
  await init();
  const all = await sheets.getAll("Proposals");
  return all.filter((p) => p.listingId === listingId).sort(byNewest);
}

export async function listProposalsByArtist(artistUserId: string): Promise<Proposal[]> {
  await init();
  const all = await sheets.getAll("Proposals");
  return all.filter((p) => p.artistUserId === artistUserId).sort(byNewest);
}

export async function listAllProposals(): Promise<Proposal[]> {
  await init();
  return sheets.getAll("Proposals");
}

export async function getProposal(id: string): Promise<Proposal | null> {
  await init();
  return sheets.getById("Proposals", id);
}

export class ProposalError extends Error {}

export async function createProposal(
  input: Omit<Proposal, "id" | "status" | "declineReason" | "createdAt">,
): Promise<Proposal> {
  await init();
  return sheets.transaction(async (tx) => {
    const listings = await tx.getAll("Listings");
    const listing = listings.find((l) => l.id === input.listingId);
    if (!listing) throw new ProposalError("That wall no longer exists.");
    if (listing.status !== "OPEN") throw new ProposalError("That wall is no longer open.");
    const proposals = await tx.getAll("Proposals");
    if (proposals.some((p) => p.listingId === listing.id && p.artistUserId === input.artistUserId)) {
      throw new ProposalError("You already responded to this wall.");
    }
    const proposal: Proposal = {
      ...input,
      id: newId("p"),
      status: "SUBMITTED",
      declineReason: "",
      createdAt: new Date().toISOString(),
    };
    await tx.append("Proposals", proposal);
    return proposal;
  });
}

/** Accepts a proposal: see lib/accept.ts for the rules. Throws AcceptError. */
export async function acceptProposal(listingId: string, proposalId: string): Promise<void> {
  await init();
  await sheets.transaction(async (tx) => {
    const listings = await tx.getAll("Listings");
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) throw new AcceptError("Wall not found.", "PROPOSAL_NOT_FOUND");
    const proposals = (await tx.getAll("Proposals")).filter((p) => p.listingId === listingId);
    const outcome = computeAccept(listing, proposals, proposalId);
    for (const { id, patch } of outcome.proposalPatches) {
      await tx.updateRow("Proposals", id, patch);
    }
    await tx.updateRow("Listings", listing.id, outcome.listingPatch);
  });
}

export async function declineProposal(listingId: string, proposalId: string, reason: string): Promise<void> {
  await init();
  await sheets.transaction(async (tx) => {
    const listings = await tx.getAll("Listings");
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) throw new AcceptError("Wall not found.", "PROPOSAL_NOT_FOUND");
    const proposal = (await tx.getAll("Proposals")).find((p) => p.id === proposalId);
    if (!proposal) throw new AcceptError("Proposal not found.", "PROPOSAL_NOT_FOUND");
    const outcome = computeDecline(listing, proposal, reason);
    await tx.updateRow("Proposals", proposal.id, outcome.proposalPatch);
  });
}

// ---------- contact reveal ----------

/**
 * Contact info for an accepted proposal, scoped to the viewer:
 *   - the artist sees the business name, address, and email;
 *   - the business sees the artist's name and email.
 * Returns null when the viewer is not allowed to see anything.
 */
export async function getContactInfo(
  viewer: User | null,
  listing: Listing,
  proposal: Proposal,
): Promise<ContactInfo | null> {
  if (!viewer || !canSeeContact(viewer, listing, proposal)) return null;
  if (viewer.id === proposal.artistUserId) {
    const business = await getUserById(listing.businessUserId);
    return {
      businessName: listing.businessName,
      businessAddress: listing.address,
      businessEmail: business?.email ?? "",
    };
  }
  if (viewer.id === listing.businessUserId) {
    const artist = await getUserById(proposal.artistUserId);
    return { artistName: proposal.artistName, artistEmail: artist?.email ?? "" };
  }
  return null;
}

// ---------- image reference check ----------

/** True if some listing or proposal references this image id. */
export async function isImageReferenced(fileId: string): Promise<boolean> {
  await init();
  const [listings, proposals] = await Promise.all([sheets.getAll("Listings"), sheets.getAll("Proposals")]);
  return listings.some((l) => l.imageFileIds.includes(fileId)) || proposals.some((p) => p.imageFileIds.includes(fileId));
}

// ---------- counts for demo caps ----------

export async function countRecentByUser(tab: "Listings" | "Proposals", userId: string, sinceMs: number): Promise<number> {
  await init();
  const cutoff = Date.now() - sinceMs;
  if (tab === "Listings") {
    const all = await sheets.getAll("Listings");
    return all.filter((l) => l.businessUserId === userId && Date.parse(l.createdAt) > cutoff).length;
  }
  const all = await sheets.getAll("Proposals");
  return all.filter((p) => p.artistUserId === userId && Date.parse(p.createdAt) > cutoff).length;
}

export async function countAll(tab: "Listings" | "Proposals"): Promise<number> {
  await init();
  return (await sheets.getAll(tab)).length;
}

function byNewest(a: { createdAt: string }, b: { createdAt: string }) {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}
