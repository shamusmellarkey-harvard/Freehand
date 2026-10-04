import type { Metadata } from "next";
import { ListingForm } from "@/components/ListingForm";
import { EmptyState, LoginRequired, PageTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canCreateListing } from "@/lib/authz";
import { MAX_IMAGE_BYTES } from "@/lib/config";

export const metadata: Metadata = { title: "Post a wall" };
export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!user) return <LoginRequired message="Log in as a business to post a wall." next="/listings/new" />;
  if (!canCreateListing(user)) {
    return (
      <EmptyState
        title="Business accounts only"
        body="Only business accounts can post walls. You are logged in as an artist. In demo mode, use “Switch demo user” in the header to try as a business."
      />
    );
  }

  // Default the business name from the user's name, stripping a trailing "(…)" note.
  const defaultBusinessName = user.name.replace(/^.*\((.*)\)\s*$/, "$1").trim() || user.name;

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Post a wall" subtitle="Tell artists what you have and what you are hoping for." />
      <div className="card p-5 sm:p-6">
        <ListingForm defaultBusinessName={defaultBusinessName} maxImageBytes={MAX_IMAGE_BYTES} />
      </div>
    </div>
  );
}
