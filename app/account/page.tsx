import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { ProposalCard } from "@/components/ProposalCard";
import { ListingBadge, RoleChip } from "@/components/StatusBadge";
import { EmptyState, LoginRequired, Notice, PageTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEMO_MODE } from "@/lib/config";
import { getContactInfo, listAllListings, listListingsByOwner, listProposalsByArtist, listAllProposals } from "@/lib/db";
import type { ContactInfo, Listing, Proposal, User } from "@/lib/types";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ responded?: string }> }) {
  const [{ responded }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) return <LoginRequired message="Log in to see your dashboard." next="/account" />;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={user.role === "BUSINESS" ? "My walls" : "My responses"}
        subtitle={`Signed in as ${user.name}`}
        action={
          <div className="flex items-center gap-2">
            <RoleChip role={user.role} />
            {user.role === "BUSINESS" && (
              <Link href="/listings/new" className="btn-primary">
                Post a wall
              </Link>
            )}
            {user.role === "ARTIST" && (
              <Link href="/listings" className="btn-primary">
                Browse open walls
              </Link>
            )}
          </div>
        }
      />
      {responded && <Notice tone="success">Your response was sent. The business will see it on their dashboard.</Notice>}
      {DEMO_MODE && (
        <p className="text-sm text-muted">
          Tip: use <span className="font-medium">Switch demo user</span> in the header to see the other side of the loop.
        </p>
      )}
      {user.role === "BUSINESS" ? <BusinessDashboard user={user} /> : <ArtistDashboard user={user} />}
    </div>
  );
}

async function BusinessDashboard({ user }: { user: User }) {
  const [listings, proposals] = await Promise.all([listListingsByOwner(user.id), listAllProposals()]);
  if (listings.length === 0) {
    return (
      <EmptyState
        title="You have not posted a wall yet"
        body="Post your first wall with a photo, size, and the vibe you want. Artists will respond with proposals."
        action={
          <Link href="/listings/new" className="btn-primary">
            Post a wall
          </Link>
        }
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => {
        const mine = proposals.filter((p) => p.listingId === l.id);
        const pending = mine.filter((p) => p.status === "SUBMITTED").length;
        return (
          <div key={l.id} className="flex flex-col gap-2">
            <ListingCard
              listing={l}
              extra={
                <div className="flex items-center justify-between">
                  <ListingBadge status={l.status} />
                  <span className="text-sm text-muted">
                    {mine.length} response{mine.length === 1 ? "" : "s"}
                    {pending > 0 && <span className="text-ink"> · {pending} to review</span>}
                  </span>
                </div>
              }
            />
            <Link href={`/listings/${l.id}/proposals`} className={pending > 0 ? "btn-primary" : "btn-secondary"}>
              Review responses
            </Link>
          </div>
        );
      })}
    </div>
  );
}

async function ArtistDashboard({ user }: { user: User }) {
  const [proposals, listings] = await Promise.all([listProposalsByArtist(user.id), listAllListings()]);
  if (proposals.length === 0) {
    return (
      <EmptyState
        title="You have not responded to any walls yet"
        body="Browse open walls and respond with photos of your work and a materials estimate."
        action={
          <Link href="/listings" className="btn-primary">
            Browse open walls
          </Link>
        }
      />
    );
  }
  const byId = new Map<string, Listing>(listings.map((l) => [l.id, l]));
  const rows: { proposal: Proposal; listing: Listing | undefined; contact: ContactInfo | null }[] = [];
  for (const p of proposals) {
    const listing = byId.get(p.listingId);
    const contact = listing ? await getContactInfo(user, listing, p) : null;
    rows.push({ proposal: p, listing, contact });
  }
  return (
    <div className="flex flex-col gap-5">
      {rows.map(({ proposal, listing, contact }) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          contact={contact}
          heading={
            listing ? (
              <p className="text-sm text-muted">
                Response to{" "}
                <Link href={`/listings/${listing.id}`} className="font-medium text-ink underline underline-offset-2">
                  {listing.title}
                </Link>{" "}
                at {listing.businessName}
              </p>
            ) : (
              <p className="text-sm text-muted">Response to a wall that no longer exists</p>
            )
          }
        />
      ))}
    </div>
  );
}
