import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DemoLoginButton } from "@/components/DemoLoginButton";
import { LoginForm } from "@/components/LoginForm";
import { PageTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEMO_MODE } from "@/lib/config";
import { safeRedirectPath } from "@/lib/http";
import { DEMO_ARTIST_ID, DEMO_BUSINESS_ID } from "@/lib/seed";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeRedirectPath(next, "/account");
  const user = await getCurrentUser();
  if (user) redirect(target);

  return (
    <div className="mx-auto max-w-md">
      <PageTitle title="Log in" subtitle="Passwordless. We email you a one-time code." />

      {DEMO_MODE && (
        <div className="card mb-6 p-5">
          <p className="font-semibold">Fastest way in: one click</p>
          <p className="mb-3 text-sm text-muted">Sign in as a seeded demo user. No email needed.</p>
          <div className="flex flex-wrap gap-2">
            <DemoLoginButton userId={DEMO_BUSINESS_ID} redirectTo={target} className="btn-primary">
              Try as a business
            </DemoLoginButton>
            <DemoLoginButton userId={DEMO_ARTIST_ID} redirectTo={target} className="btn-sage">
              Try as an artist
            </DemoLoginButton>
          </div>
          <p className="mt-4 text-center text-xs uppercase tracking-wide text-muted">or use the email flow</p>
        </div>
      )}

      <div className="card p-5">
        <LoginForm demoMode={DEMO_MODE} next={target} />
      </div>
    </div>
  );
}
