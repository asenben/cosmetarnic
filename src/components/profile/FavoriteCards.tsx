"use client";

import { Heart } from "lucide-react";
import { useFavoriteIds } from "@/components/FavoritesProvider";
import ProductCard, { type Product } from "@/components/ProductCard";

// The cards on the "Любими" page. A listing leaves the page as soon as its heart is taken off.
type FavoriteCardsProps = {
  listings: Product[];
  // Shows nothing instead of the "no favourites yet" note when there are no listings.
  quietWhenEmpty?: boolean;
};

export default function FavoriteCards({ listings, quietWhenEmpty = false }: FavoriteCardsProps) {
  const ids = useFavoriteIds();
  const shown = listings.filter(({ id }) => ids.has(id));

  if (shown.length === 0) {
    if (quietWhenEmpty) return null;
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
          <Heart className="size-7" aria-hidden />
        </span>
        Все още нямаш любими обяви.
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {shown.map((listing) => (
        <ProductCard key={listing.id} {...listing} />
      ))}
    </div>
  );
}
