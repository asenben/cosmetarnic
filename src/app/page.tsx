import type { Metadata } from "next";
import Marketplace, { type MarketplaceListing } from "@/components/Marketplace";
import { getCurrentUser } from "@/lib/auth/session";
import { getListings, postedAgo } from "@/lib/listings";
import { listingImageUrl } from "@/lib/listings/images";

// The layout's "<page> | <username>" pattern does not reach the page beside it, so the home page
// builds the same title itself.
export async function generateMetadata(): Promise<Metadata> {
  const owner = (await getCurrentUser())?.username ?? "Козметарник";
  return { title: { absolute: `Продавалник | ${owner}` } };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  // What was typed in the search field of the navigation, if the visitor came from there.
  const { q } = await searchParams;
  const search = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  const listings: MarketplaceListing[] = (await getListings(search)).map((listing) => ({
    id: listing.id,
    href: `/product/${listing.id}`,
    image: listing.images[0] && listingImageUrl(listing.images[0]),
    brand: listing.brand,
    price: listing.price,
    city: listing.city,
    postedAgo: postedAgo(listing.createdAt),
    condition: listing.condition,
    delivery: listing.delivery,
    categories: listing.categories,
  }));

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-6 px-4 py-6 sm:px-6">
        {/* A new search starts with the filters cleared. */}
        <Marketplace key={search} listings={listings} search={search} />
      </div>
    </main>
  );
}
