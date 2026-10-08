import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ListingActions from "@/components/sell/ListingActions";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserListings, postedAgo, type Listing } from "@/lib/listings";
import { listingImageUrl } from "@/lib/listings/images";

export const metadata: Metadata = {
  title: "Моите обяви",
};

// One group of the user's listings, each card with the owner's buttons under it.
function Cards({ listings }: { listings: Listing[] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
      {listings.map((listing) => (
        <div key={listing.id}>
          <ProductCard
            id={listing.id}
            href={`/product/${listing.id}`}
            image={listing.images[0] && listingImageUrl(listing.images[0])}
            brand={listing.brand}
            price={listing.price}
            city={listing.city}
            postedAgo={postedAgo(listing.createdAt)}
            condition={listing.condition}
            delivery={listing.delivery}
            sold={listing.sold}
          />
          <ListingActions id={listing.id} sold={listing.sold} className="mt-2" />
        </div>
      ))}
    </div>
  );
}

export default async function ProfileListings() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const listings = await getUserListings(user.id);
  const active = listings.filter(({ sold }) => !sold);
  const sold = listings.filter((listing) => listing.sold);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Моите обяви</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Обявите, които си публикувал.</p>

      {listings.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <Package className="size-7" aria-hidden />
          </span>
          Все още нямаш обяви.
        </div>
      )}

      {active.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold tracking-wider text-brand-ink uppercase">Активни ({active.length})</h2>
          <Cards listings={active} />
        </section>
      )}

      {sold.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold tracking-wider text-brand-ink uppercase">Продадени ({sold.length})</h2>
          <Cards listings={sold} />
        </section>
      )}
    </div>
  );
}
