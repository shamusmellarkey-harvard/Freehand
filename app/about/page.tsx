import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { DEMO_MODE, STORAGE_MODE } from "@/lib/config";

export const metadata: Metadata = { title: "About" };
export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <PageTitle title="About Freehand" subtitle="Walls need art. Artists need walls." />

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">What it is</h2>
        <p>
          Freehand is a tiny matchmaking service for the Greater Cambridge and Boston area. Local businesses with blank
          walls post what they are looking for. Emerging artists respond with photos of their work and an itemized estimate
          of what materials would cost. The business picks one. Afterwards they connect directly: the business covers only
          the materials, the artist gets a wall and an audience, and the business keeps the finished piece.
        </p>
        <div className="rounded-2xl border border-sun/50 bg-sun-soft p-4 text-sm">
          <p className="font-semibold">No money changes hands here, and no real emails are sent.</p>
          <p className="mt-1 text-muted">
            Freehand only displays the artist’s estimated materials cost. Reimbursement happens between the two parties,
            off-platform. Login codes are shown on screen in demo mode instead of being emailed.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Who it is for</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="card p-4">
            <h3 className="font-semibold">Emerging artists</h3>
            <p className="text-sm text-muted">Students and early-career artists who want their work seen, for free.</p>
          </li>
          <li className="card p-4">
            <h3 className="font-semibold">Local businesses</h3>
            <p className="text-sm text-muted">Cafés, shops, studios, and offices that want original art without gallery prices.</p>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">The loop</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>A person logs in with a one-time email code (no passwords).</li>
          <li>A business posts a wall: photos, size in inches, and the vibe they want.</li>
          <li>An artist responds with photos of their work and a materials estimate.</li>
          <li>The business accepts or declines. Accepting reveals contact details to both sides.</li>
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Walkthrough: what to click</h2>
        <ol className="space-y-3">
          {[
            ["Click “Try as a business” in the header.", "You are now Lena at Cardinal Coffee. You land on your dashboard."],
            ["Click “Post a wall”.", "Fill in a title, address, size, vibe, and add a photo. Any JPEG or PNG works. Submit."],
            ["Open “Switch demo user” and pick Jules Okafor (Artist).", "Go to “Browse walls”, open your new wall, and click “Respond to this wall”."],
            ["Fill in the response.", "Add a photo, a description, and a few materials. Watch the total update live. Send it."],
            ["Switch back to Lena (Business).", "On “My account”, click “Review responses” on your wall. Accept the proposal."],
            ["See the result.", "The wall is now Filled, other responses are auto-declined, and contact details appear for both parties. Switch to Jules to see the artist’s side."],
          ].map(([title, body], i) => (
            <li key={i} className="card flex gap-3 p-4">
              <span className="font-display text-2xl text-terracotta">{i + 1}</span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">
          You can also log in with any email address: the login page shows your one-time code on screen in demo mode.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Tech stack</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel.</li>
          <li>Database: a Google Sheet, accessed server-side through the Sheets API with a service account.</li>
          <li>Images: a Google Drive folder, served through a private proxy route (files are never public).</li>
          <li>Auth: passwordless 6-digit codes, hashed at rest; sessions are signed httpOnly JWT cookies (jose).</li>
          <li>Validation with zod on every route; unit tests with Vitest.</li>
          <li>
            Without Google credentials the app runs on an in-memory data layer with seed data, which is how this demo is
            running right now:{" "}
            <span className="font-medium">
              storage = {STORAGE_MODE === "google" ? "Google Sheets + Drive" : "in-memory / local"}, demo mode ={" "}
              {DEMO_MODE ? "on" : "off"}
            </span>
            .
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Good to know</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Demo data may reset at any time (serverless instances restart).</li>
          <li>Demo accounts use @example.com addresses. No real email is ever shown publicly.</li>
          <li>There is no payment, messaging, editing, or notification feature in this MVP, on purpose.</li>
        </ul>
        <div className="pt-2">
          <Link href="/" className="btn-primary">
            Back to the tour
          </Link>
        </div>
      </section>
    </div>
  );
}
