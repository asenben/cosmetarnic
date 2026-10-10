import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import ListingActions from "@/components/sell/ListingActions";
import type { AdminListing } from "@/lib/admin";
import { listingImageUrl } from "@/lib/listings/images";
import { formatPrice } from "@/lib/format";

const dateFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Sofia",
});

type ListingsTableProps = {
  listings: AdminListing[];
  // Left out on a seller's own page, where every listing is theirs.
  showSeller?: boolean;
};

// The administrator's list of listings: each opens on its page, and can be edited or deleted
// whoever published it.
export default function ListingsTable({ listings, showSeller = true }: ListingsTableProps) {
  if (listings.length === 0) {
    return <p className="py-10 text-center text-sm text-brand-ink/60">Няма обяви.</p>;
  }

  return (
    <ul className="divide-y divide-black/5">
      {listings.map((listing) => (
        <li key={listing.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
          <Link
            href={`/product/${listing.id}`}
            className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-brand-pale"
            aria-label={`Отвори обявата „${listing.title}“`}
          >
            {listing.image ? (
              <Image src={listingImageUrl(listing.image)} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <Image src="/images/logo.svg" alt="" fill sizes="56px" className="p-2.5 opacity-80" />
            )}
          </Link>

          <div className="min-w-0 flex-1 basis-56">
            <Link
              href={`/product/${listing.id}`}
              className="block truncate text-sm font-semibold text-brand-ink transition-colors hover:text-brand-rose"
            >
              {listing.title}
            </Link>
            <p className="truncate text-xs text-brand-ink/60">
              ID {listing.number} · {listing.brand} · {listing.city} · {dateFormat.format(listing.createdAt)}
            </p>
            {showSeller && (
              <p className="truncate text-xs text-brand-ink/60">
                Продавач:{" "}
                <Link href={`/admin/users/${listing.seller.id}`} className="font-semibold text-brand-rose hover:underline">
                  {listing.seller.username}
                </Link>
              </p>
            )}
          </div>

          <p className="flex shrink-0 items-center gap-1.5 text-xs text-brand-ink/60" title="Преглеждания">
            <Eye className="size-4" aria-hidden />
            {listing.views}
          </p>
          <p className="w-20 shrink-0 text-right text-sm font-bold text-brand-ink">{formatPrice(listing.price)}</p>

          <ListingActions id={listing.id} className="w-56 shrink-0" />
        </li>
      ))}
    </ul>
  );
}
