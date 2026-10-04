import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState, PageTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listOpenListings } from "@/lib/db";

export const metadata: Metadata = { title: "Browse walls" };
export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const [user, listings] = await Promise.all([getCurrentUser(), listOpenListings()]);
  return (
    <div>
      <PageTitle
        title="Open walls"
        subtitle="Businesses around Greater Boston looking for original art."
        action={
          user?.role === "BUSINESS" ? (
            <Link href="/listings/new" className="btn-primary">
              Post a wall
            </Link>
          ) : undefined
        }
      />
      {listings.length === 0 ? (
        <EmptyState
          title="No open walls right now"
          body="Check back soon, or if you run a business, post the first one."
          action={
            <Link href={user?.role === "BUSINESS" ? "/listings/new" : "/login?next=/listings/new"} className="btn-primary">
              Post a wall
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
