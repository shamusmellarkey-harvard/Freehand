import Link from "next/link";
import { DemoLoginButton } from "@/components/DemoLoginButton";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEMO_MODE } from "@/lib/config";
import { listOpenListings } from "@/lib/db";
import { DEMO_ARTIST_ID, DEMO_BUSINESS_ID } from "@/lib/seed";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  let listings: Listing[] = [];
  let loadError: string | null = null;
  try {
    listings = await listOpenListings();
  } catch (err) {
    console.error(err);
    loadError = "We could not load walls right now. Please refresh in a moment.";
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
          Walls need art. <span className="text-terracotta">Artists need walls.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Freehand matches emerging artists with local businesses around Cambridge and Greater Boston. Artists show their
          work for free. Businesses get original art for the cost of materials, and keep it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/listings" className="btn-primary px-5 py-2.5 text-base">
            Browse open walls
          </Link>
          {!user && (
            <Link href="/login" className="btn-secondary px-5 py-2.5 text-base">
              Log in
            </Link>
          )}
          {user && (
            <Link href="/account" className="btn-secondary px-5 py-2.5 text-base">
              My account
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="how" className="grid gap-4 sm:grid-cols-4">
        <h2 id="how" className="sr-only">
          How it works
        </h2>
        {[
          ["1", "A business posts a wall", "Photos, size, and the vibe they want."],
          ["2", "Artists respond", "With photos of their work and a materials estimate."],
          ["3", "The business picks one", "Accept one response; the rest are politely declined."],
          ["4", "They connect", "Contact details are revealed. Materials are reimbursed directly."],
        ].map(([n, title, body]) => (
          <div key={n} className="card p-4">
            <span className="font-display text-2xl text-terracotta">{n}</span>
            <h3 className="mt-1 font-semibold">{title}</h3>
            <p className="text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>

      {DEMO_MODE && (
        <section aria-labelledby="tour" className="rounded-3xl border border-sun/50 bg-sun-soft p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="tour" className="text-2xl font-semibold sm:text-3xl">
              Take the 2-minute tour
            </h2>
            <p className="text-sm text-muted">No account needed. Every button below signs you in instantly.</p>
          </div>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            <li className="card flex flex-col gap-3 p-4">
              <p className="font-display text-3xl text-terracotta">1</p>
              <h3 className="font-semibold">Try as a business and post a wall</h3>
              <p className="flex-1 text-sm text-muted">
                Sign in as Cardinal Coffee, then post a new wall with a photo, size, and vibe.
              </p>
              <DemoLoginButton userId={DEMO_BUSINESS_ID} redirectTo="/listings/new" className="btn-primary">
                Try as a business
              </DemoLoginButton>
            </li>
            <li className="card flex flex-col gap-3 p-4">
              <p className="font-display text-3xl text-sage">2</p>
              <h3 className="font-semibold">Switch to artist and respond</h3>
              <p className="flex-1 text-sm text-muted">
                Sign in as Jules, open the wall you just posted, and respond with photos and a materials estimate.
              </p>
              <DemoLoginButton userId={DEMO_ARTIST_ID} redirectTo="/listings" className="btn-sage">
                Switch to artist
              </DemoLoginButton>
            </li>
            <li className="card flex flex-col gap-3 p-4">
              <p className="font-display text-3xl text-terracotta">3</p>
              <h3 className="font-semibold">Switch back and accept</h3>
              <p className="flex-1 text-sm text-muted">
                Back as Cardinal Coffee, review the responses on your dashboard and accept one. Contact info appears.
              </p>
              <DemoLoginButton userId={DEMO_BUSINESS_ID} redirectTo="/account" className="btn-primary">
                Switch to business
              </DemoLoginButton>
            </li>
          </ol>
          <p className="mt-4 text-xs text-muted">
            Prefer to read first? See the{" "}
            <Link href="/about" className="underline underline-offset-2">
              About page
            </Link>
            .
          </p>
        </section>
      )}

      <section aria-labelledby="open">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="open" className="text-2xl font-semibold sm:text-3xl">
            Open walls
          </h2>
          <Link href="/listings" className="text-sm underline underline-offset-2">
            See all
          </Link>
        </div>
        {loadError ? (
          <EmptyState title="Something went wrong" body={loadError} />
        ) : listings.length === 0 ? (
          <EmptyState
            title="No open walls yet"
            body="Businesses: be the first to post a wall that needs art."
            action={
              <Link href="/listings/new" className="btn-primary">
                Post a wall
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.slice(0, 6).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
