import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-10 w-1/2 max-w-xs" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );
}
