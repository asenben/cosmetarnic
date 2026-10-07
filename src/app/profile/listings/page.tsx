import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserListings, postedAgo } from "@/lib/listings";
import { listingImageUrl } from "@/lib/listings/images";

export const metadata: Metadata = {
  title: "Моите обяви",
};

export default async function ProfileListings() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const listings = await getUserListings(user.id);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Моите обяви</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Обявите, които си публикувал.</p>

      {listings.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {listings.map((listing) => (
            <ProductCard
              key={listing.id}
              href={`/product/${listing.id}`}
              image={listing.images[0] && listingImageUrl(listing.images[0])}
              brand={listing.brand}
              price={listing.price}
              city={listing.city}
              postedAgo={postedAgo(listing.createdAt)}
              condition={listing.condition}
              delivery={listing.delivery}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <Package className="size-7" aria-hidden />
          </span>
          Все още нямаш обяви.
        </div>
      )}
    </div>
  );
}
