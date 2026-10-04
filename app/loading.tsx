import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-10 w-2/3 max-w-sm" />
      <Skeleton className="h-5 w-1/2 max-w-xs" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <p className="sr-only">Loading…</p>
    </div>
  );
}
