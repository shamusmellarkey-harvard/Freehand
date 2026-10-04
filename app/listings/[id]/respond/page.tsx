import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProposalForm } from "@/components/ProposalForm";
import { EmptyState, LoginRequired, PageTitle, formatInches } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canCreateProposal } from "@/lib/authz";
import { MAX_IMAGE_BYTES } from "@/lib/config";
import { getListing, listProposalsForListing } from "@/lib/db";
import { imageUrl } from "@/lib/images";

export const metadata: Metadata = { title: "Respond to a wall" };
export const dynamic = "force-dynamic";

export default async function RespondPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, listing] = await Promise.all([getCurrentUser(), getListing(id)]);
  if (!listing) notFound();
  if (!user) return <LoginRequired message="Log in as an artist to respond to this wall." next={`/listings/${id}/respond`} />;

  const proposals = await listProposalsForListing(listing.id);
  if (!canCreateProposal(user, listing, proposals)) {
    const why =
      user.role !== "ARTIST"
        ? "Only artist accounts can respond to walls. In demo mode, use “Switch demo user” to try as an artist."
        : listing.status !== "OPEN"
          ? "This wall is no longer open."
          : "You already responded to this wall. One response per wall.";
    return (
      <EmptyState
        title="You cannot respond to this wall"
        body={why}
        action={
          <Link href={`/listings/${listing.id}`} className="btn-secondary">
            Back to the wall
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Respond to this wall" subtitle="Show your work and estimate your materials." />
      <Link href={`/listings/${listing.id}`} className="card mb-5 flex items-center gap-4 p-3 hover:border-ink/30">
        {listing.imageFileIds[0] && (
          <img
            src={imageUrl(listing.imageFileIds[0])}
            alt=""
            className="h-16 w-20 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{listing.title}</p>
          <p className="text-sm text-muted">
            {listing.businessName} · wants about {formatInches(listing.desiredWidthIn, listing.desiredHeightIn)}
          </p>
        </div>
      </Link>
      <div className="card p-5 sm:p-6">
        <ProposalForm
          listingId={listing.id}
          defaultWidth={listing.desiredWidthIn}
          defaultHeight={listing.desiredHeightIn}
          maxImageBytes={MAX_IMAGE_BYTES}
        />
      </div>
    </div>
  );
}
