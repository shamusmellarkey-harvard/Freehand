import Link from "next/link";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      {body && <p className="max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-rose-ink/20 bg-rose-soft px-3 py-2 text-sm text-rose-ink">
      {message}
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "success" }) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-sm ${
        tone === "success" ? "border border-sage/30 bg-sage-soft text-sage" : "border border-sun/40 bg-sun-soft text-ink"
      }`}
    >
      {children}
    </div>
  );
}

export function LoginRequired({ message, next }: { message: string; next: string }) {
  return (
    <EmptyState
      title="Please log in"
      body={message}
      action={
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary">
          Log in
        </Link>
      }
    />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-line/70 ${className}`} />;
}

export function formatInches(w: number, h: number) {
  return `${w}″ × ${h}″`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
