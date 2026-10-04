import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
        <p>
          <span className="font-display text-base text-ink">Freehand</span> · Walls need art. Artists need walls.
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/listings" className="hover:text-ink">
            Browse walls
          </Link>
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
        </nav>
        <p className="w-full text-xs sm:w-auto">No payments happen here. Freehand only shows estimated materials cost.</p>
      </div>
    </footer>
  );
}
