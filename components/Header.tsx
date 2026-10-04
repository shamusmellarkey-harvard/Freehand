import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEMO_MODE } from "@/lib/config";
import { getDemoUsers } from "@/lib/db";
import { DEMO_ARTIST_ID, DEMO_BUSINESS_ID } from "@/lib/seed";
import type { PublicUser, User } from "@/lib/types";
import { DemoLoginButton } from "./DemoLoginButton";
import { RoleChip } from "./StatusBadge";

export async function Header() {
  let user: User | null = null;
  let demoUsers: PublicUser[] = [];
  try {
    user = await getCurrentUser();
    if (DEMO_MODE) demoUsers = await getDemoUsers();
  } catch (err) {
    console.error("[freehand] header data error:", err);
  }

  return (
    <header className="border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-ink">
          Freehand
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          <Link href="/listings" className="btn-ghost px-3 py-1.5">
            Browse walls
          </Link>
          <Link href="/about" className="btn-ghost px-3 py-1.5">
            About
          </Link>
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {DEMO_MODE && (
            <details className="menu relative">
              <summary className="btn-secondary px-3 py-1.5 text-xs sm:text-sm">
                Switch demo user
                <span aria-hidden="true">▾</span>
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-line bg-paper p-2 shadow-lg">
                <p className="px-2 pb-1 pt-1 text-xs text-muted">Sign in instantly as a demo user:</p>
                {demoUsers.length === 0 && <p className="px-2 py-1 text-xs text-muted">Loading demo users…</p>}
                {demoUsers.map((u) => (
                  <DemoLoginButton
                    key={u.id}
                    userId={u.id}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-ink/5 ${
                      user?.id === u.id ? "bg-sage-soft" : ""
                    }`}
                  >
                    <span className="truncate">{u.name}</span>
                    <RoleChip role={u.role} />
                  </DemoLoginButton>
                ))}
              </div>
            </details>
          )}

          {user ? (
            <>
              <Link href="/account" className="btn-ghost max-w-[11rem] px-3 py-1.5 text-sm">
                <span className="truncate">{user.name}</span>
                <RoleChip role={user.role} />
              </Link>
              <form action="/api/auth/logout" method="post">
                <input type="hidden" name="redirectTo" value="/" />
                <button type="submit" className="btn-secondary px-3 py-1.5 text-sm">
                  Log out
                </button>
              </form>
            </>
          ) : DEMO_MODE ? (
            <>
              <DemoLoginButton userId={DEMO_BUSINESS_ID} redirectTo="/account" className="btn-primary px-3 py-1.5 text-xs sm:text-sm">
                Try as a business
              </DemoLoginButton>
              <DemoLoginButton userId={DEMO_ARTIST_ID} redirectTo="/account" className="btn-sage px-3 py-1.5 text-xs sm:text-sm">
                Try as an artist
              </DemoLoginButton>
              <Link href="/login" className="btn-ghost px-3 py-1.5 text-sm">
                Log in
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary px-3 py-1.5 text-sm">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
