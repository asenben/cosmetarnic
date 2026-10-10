import { getCategories } from "@/lib/categories";
import { getListings } from "@/lib/listings";
import { listingImageUrl } from "@/lib/listings/images";

// How many listings the list under the search field offers at most.
const LIMIT = 8;

export type SearchResult = {
  id: string;
  title: string;
  brand: string;
  // The names of its categories, e.g. "Грим, Грижа за кожата".
  category: string;
  price: number;
  image: string | null;
};

// The listings that match what was typed in the search field, newest first.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (!query.trim()) return Response.json({ results: [] });

  try {
    const categories = await getCategories();
    const results: SearchResult[] = (await getListings(query, LIMIT)).map((listing) => ({
      id: listing.id,
      title: listing.title,
      brand: listing.brand,
      category: categories
        .filter(({ value }) => listing.categories.includes(value))
        .map(({ label }) => label)
        .join(", "),
      price: listing.price,
      image: listing.images[0] ? listingImageUrl(listing.images[0]) : null,
    }));
    return Response.json({ results });
  } catch (error) {
    console.error("Search failed", error);
    return Response.json({ message: "Търсенето не успя." }, { status: 500 });
  }
}
