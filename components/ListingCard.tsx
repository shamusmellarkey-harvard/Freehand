import Link from "next/link";
import { imageUrl } from "@/lib/images";
import type { Listing } from "@/lib/types";
import { formatInches } from "./ui";

export function ListingCard({ listing, extra }: { listing: Listing; extra?: React.ReactNode }) {
  const cover = listing.imageFileIds[0];
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-line/50">
        {cover ? (
          <img
            src={imageUrl(cover)}
            alt={`Wall photo for ${listing.title}`}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-lg font-semibold leading-snug">{listing.title}</h3>
        <p className="text-sm text-muted">{listing.businessName}</p>
        <p className="text-sm">
          <span className="text-muted">Wants about</span> {formatInches(listing.desiredWidthIn, listing.desiredHeightIn)}
        </p>
        <p className="line-clamp-2 text-sm text-ink/80">{listing.vibeDescription}</p>
        {extra && <div className="mt-2">{extra}</div>}
      </div>
    </Link>
  );
}
