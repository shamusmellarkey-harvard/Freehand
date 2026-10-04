import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionButtons } from "@/components/DecisionButtons";
import { ProposalCard } from "@/components/ProposalCard";
import { ListingBadge } from "@/components/StatusBadge";
import { EmptyState, LoginRequired, Notice, PageTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageProposals } from "@/lib/authz";
import { getContactInfo, getListing, listProposalsForListing } from "@/lib/db";

export const metadata: Metadata = { title: "Review responses" };
export const dynamic = "force-dynamic";

export default async function ReviewProposalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, listing] = await Promise.all([getCurrentUser(), getListing(id)]);
  if (!listing) notFound();
  if (!user) return <LoginRequired message="Log in to review responses to your wall." next={`/listings/${id}/proposals`} />;
  if (!canManageProposals(user, listing)) {
    return (
      <EmptyState
        title="Not your wall"
        body="Only the business that posted this wall can review its responses."
        action={
          <Link href={`/listings/${listing.id}`} className="btn-secondary">
            View the wall
          </Link>
        }
      />
    );
  }

  const proposals = await listProposalsForListing(listing.id);
  const accepted = proposals.find((p) => p.status === "ACCEPTED");
  const contact = accepted ? await getContactInfo(user, listing, accepted) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Review responses"
        subtitle={listing.title}
        action={
          <div className="flex items-center gap-3">
            <ListingBadge status={listing.status} />
            <Link href={`/listings/${listing.id}`} className="btn-secondary text-sm">
              View wall
            </Link>
          </div>
        }
      />

      {listing.status === "FILLED" && accepted && (
        <Notice tone="success">
          This wall is filled. You accepted <span className="font-medium">{accepted.title}</span> by {accepted.artistName}.
          Contact details are below.
        </Notice>
      )}

      {proposals.length === 0 ? (
        <EmptyState title="No responses yet" body="Artists browsing open walls will see this one. Check back soon." />
      ) : (
        <div className="flex flex-col gap-5">
          {proposals.map((p) => (
            <div key={p.id} id={p.id} className="scroll-mt-24">
              <ProposalCard
                proposal={p}
                contact={p.id === accepted?.id ? contact : null}
                footer={
                  p.status === "SUBMITTED" && listing.status === "OPEN" ? (
                    <DecisionButtons proposalId={p.id} artistName={p.artistName} />
                  ) : null
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
