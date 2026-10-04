import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/ImageGallery";
import { ListingBadge, ProposalBadge } from "@/components/StatusBadge";
import { Notice, PageTitle, formatDate, formatInches } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canCreateProposal, isListingOwner } from "@/lib/authz";
import { getListing, listProposalsForListing } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  return { title: listing ? listing.title : "Wall not found" };
}

export default async function ListingDetailPage({ params, searchParams }: Props) {
  const [{ id }, { posted }, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const listing = await getListing(id);
  if (!listing) notFound();

  const proposals = await listProposalsForListing(listing.id);
  const owner = isListingOwner(user, listing);
  const alreadyResponded = !!user && proposals.some((p) => p.artistUserId === user.id);
  const canRespond = canCreateProposal(user, listing, proposals);
  const myProposal = user ? proposals.find((p) => p.artistUserId === user.id) : undefined;

  return (
    <div className="flex flex-col gap-6">
      {posted && <Notice tone="success">Your wall is posted. Artists can now respond to it.</Notice>}

      <PageTitle
        title={listing.title}
        subtitle={`${listing.businessName} · ${listing.address}`}
        action={<ListingBadge status={listing.status} />}
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ImageGallery fileIds={listing.imageFileIds} altPrefix={`Wall at ${listing.businessName}`} />

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Desired size</p>
            <p className="font-display text-2xl">{formatInches(listing.desiredWidthIn, listing.desiredHeightIn)}</p>
            <p className="text-xs text-muted">width × height, inches. Posted {formatDate(listing.createdAt)}.</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">The wall</p>
            <p className="prose-wrap mt-1 text-sm leading-relaxed">{listing.wallDescription}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">The vibe</p>
            <p className="prose-wrap mt-1 text-sm leading-relaxed">{listing.vibeDescription}</p>
          </div>

          {/* Call to action, depending on who is looking. */}
          {owner ? (
            <Link href={`/listings/${listing.id}/proposals`} className="btn-primary">
              Review responses ({proposals.length})
            </Link>
          ) : canRespond ? (
            <Link href={`/listings/${listing.id}/respond`} className="btn-primary">
              Respond to this wall
            </Link>
          ) : user?.role === "ARTIST" && alreadyResponded && myProposal ? (
            <Notice tone="success">
              You responded to this wall. Status: <ProposalBadge status={myProposal.status} />{" "}
              <Link href="/account" className="underline underline-offset-2">
                View on your dashboard
              </Link>
            </Notice>
          ) : user?.role === "ARTIST" && listing.status !== "OPEN" ? (
            <Notice>This wall is no longer open for responses.</Notice>
          ) : !user ? (
            <div className="card p-4 text-sm">
              <p className="font-medium">Are you an artist?</p>
              <p className="mb-3 text-muted">Log in to respond with photos of your work and a materials estimate.</p>
              <Link href={`/login?next=/listings/${listing.id}`} className="btn-primary">
                Log in to respond
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {owner && (
        <section className="mt-2">
          <h2 className="mb-3 text-2xl font-semibold">Responses</h2>
          {proposals.length === 0 ? (
            <p className="card p-4 text-sm text-muted">No responses yet. Artists browsing open walls will see this one.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {proposals.map((p) => (
                <li key={p.id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-sm text-muted">by {p.artistName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProposalBadge status={p.status} />
                    <Link href={`/listings/${listing.id}/proposals#${p.id}`} className="btn-secondary text-sm">
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
