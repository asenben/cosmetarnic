"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Ellipsis, Eye, MessageCircle } from "lucide-react";
import type { ProfileListing } from "@/data/profile";

type Status = ProfileListing["status"];

const tabs: { status: Status; label: string }[] = [
  { status: "active", label: "Активни" },
  { status: "sold", label: "Продадени" },
  { status: "archived", label: "Архивирани" },
];

const statusBadges: Record<Status, { label: string; className: string }> = {
  active: { label: "Активна", className: "bg-emerald-50 text-emerald-700" },
  sold: { label: "Продадена", className: "bg-brand-rose/10 text-brand-rose" },
  archived: { label: "Архивирана", className: "bg-zinc-100 text-zinc-600" },
};

const priceFormat = new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" });

type ProfileListingsProps = {
  listings: ProfileListing[];
  counts: Record<Status, number>;
};

export default function ProfileListings({ listings, counts }: ProfileListingsProps) {
  const [status, setStatus] = useState<Status>("active");
  const visible = listings.filter((listing) => listing.status === status);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-ink">Моите обяви</h2>
        <Link href="/profile/listings" className="shrink-0 text-xs font-medium whitespace-nowrap text-brand-rose hover:underline">
          Виж всички
        </Link>
      </div>

      <div role="tablist" aria-label="Моите обяви" className="mt-3 flex gap-2 border-b border-black/5">
        {tabs.map((tab) => {
          const selected = tab.status === status;
          return (
            <button
              key={tab.status}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setStatus(tab.status)}
              className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-brand-rose text-brand-rose"
                  : "border-transparent text-brand-ink/60 hover:text-brand-rose"
              }`}
            >
              {tab.label} ({counts[tab.status]})
            </button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {visible.map((listing) => {
            const badge = statusBadges[listing.status];
            return (
              <li key={listing.id} className="relative overflow-hidden rounded-xl border border-black/5">
                <div className="relative aspect-square bg-brand-pale">
                  {listing.image ? (
                    <Image src={listing.image} alt="" fill sizes="180px" className="object-cover" />
                  ) : (
                    <Image
                      src="/images/logo.svg"
                      alt=""
                      width={48}
                      height={48}
                      className="absolute top-1/2 left-1/2 size-12 -translate-1/2 rounded-full opacity-70"
                    />
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Действия за ${listing.title}`}
                  className="absolute top-2 right-2 z-10 flex h-6 w-8 cursor-pointer items-center justify-center rounded-md bg-white text-brand-ink shadow-sm transition-colors hover:text-brand-rose"
                >
                  <Ellipsis className="size-4" aria-hidden />
                </button>

                <div className="space-y-1.5 p-2.5">
                  <h3 className="truncate text-xs font-semibold text-brand-ink">
                    <Link href={`/product/${listing.id}`} className="after:absolute after:inset-0">
                      {listing.title}
                    </Link>
                  </h3>
                  <p className="text-sm font-bold text-brand-ink">{priceFormat.format(listing.price)}</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-brand-ink/60">
                    <Eye className="size-3.5" aria-hidden />
                    {listing.views} преглеждания
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-brand-ink/60">
                    <MessageCircle className="size-3.5" aria-hidden />
                    {listing.messages} съобщения
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                  >
                    <Check className="size-3" aria-hidden />
                    {badge.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-brand-ink/60">Няма обяви в този раздел.</p>
      )}
    </section>
  );
}
