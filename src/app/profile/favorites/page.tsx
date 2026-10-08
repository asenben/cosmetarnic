import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FavoriteCards from "@/components/profile/FavoriteCards";
import { getCurrentUser } from "@/lib/auth/session";
import { postedAgo } from "@/lib/listings";
import { getFavoriteListings } from "@/lib/listings/favorites";
import { listingImageUrl } from "@/lib/listings/images";

export const metadata: Metadata = {
  title: "Любими",
};

export default async function ProfileFavorites() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const listings = await getFavoriteListings(user.id);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Любими</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Обявите, които си отбелязал със сърце.</p>

      <FavoriteCards
        listings={listings.map((listing) => ({
          id: listing.id,
          href: `/product/${listing.id}`,
          image: listing.images[0] && listingImageUrl(listing.images[0]),
          brand: listing.brand,
          price: listing.price,
          city: listing.city,
          postedAgo: postedAgo(listing.createdAt),
          condition: listing.condition,
          delivery: listing.delivery,
        }))}
      />
    </div>
  );
}
