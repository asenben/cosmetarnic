import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FavoriteCards from "@/components/profile/FavoriteCards";
import { FavoriteRequests } from "@/components/search/RequestBoard";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategories } from "@/lib/categories";
import { postedAgo } from "@/lib/listings";
import { getFavoriteListings } from "@/lib/listings/favorites";
import { listingImageUrl } from "@/lib/listings/images";
import { getRequests } from "@/lib/requests";
import { toBoardRequest } from "@/lib/requests/board";

export const metadata: Metadata = {
  title: "Любими",
};

export default async function ProfileFavorites() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const [listings, requests, categories] = await Promise.all([
    getFavoriteListings(user.id),
    getRequests({ viewerId: user.id, favoritesOnly: true }),
    getCategories(),
  ]);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Любими</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Обявите и публикациите, които си отбелязал със сърце.</p>

      <FavoriteCards
        // With hearts on "Търся" posts below, the empty note about listings would be out of place.
        quietWhenEmpty={requests.length > 0}
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

      {/* The posts from "Търся" that carry the user's heart. */}
      <FavoriteRequests
        requests={requests.map((request) => toBoardRequest(request, categories, user.id))}
        emptyNote={listings.length === 0 ? "Все още нямаш любими." : undefined}
      />
    </div>
  );
}
