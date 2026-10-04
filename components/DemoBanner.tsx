import Link from "next/link";
import { DEMO_MODE } from "@/lib/config";

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="border-b border-sun/40 bg-sun-soft text-ink">
      <p className="mx-auto w-full max-w-5xl px-4 py-1.5 text-center text-xs sm:px-6 sm:text-sm">
        <span className="font-medium">Demo:</span> data may reset. Use the buttons above to explore.{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-terracotta-dark">
          About this demo
        </Link>
      </p>
    </div>
  );
}
