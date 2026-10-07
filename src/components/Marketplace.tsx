"use client";

import { useState } from "react";
import { SearchX } from "lucide-react";
import FiltersSidebar from "@/components/FiltersSidebar";
import ProductCard, { type Product } from "@/components/ProductCard";
import ProductGrid, { type SortOrder } from "@/components/ProductGrid";
import { PRICE_MAX, noFilters, type Filters } from "@/components/SortBar";

// A listing as the marketplace needs it: what its card shows, plus what the filters match on.
export type MarketplaceListing = Product & { id: string; category: string };

function matches(listing: MarketplaceListing, filters: Filters) {
  if (filters.categories.length > 0 && !filters.categories.includes(listing.category)) return false;
  if (filters.condition !== "all" && listing.condition !== filters.condition) return false;
  if (listing.price < filters.priceMin) return false;
  // The slider's top means "and above", so dearer listings are not cut off.
  if (filters.priceMax < PRICE_MAX && listing.price > filters.priceMax) return false;
  if (filters.cities.length > 0 && !filters.cities.includes(listing.city)) return false;
  return true;
}

// The listings with the filters beside them. `listings` arrive newest first.
export default function Marketplace({ listings }: { listings: MarketplaceListing[] }) {
  const [filters, setFilters] = useState(noFilters);
  const [sort, setSort] = useState<SortOrder>("newest");

  const shown = listings.filter((listing) => matches(listing, filters));
  if (sort !== "newest") {
    const direction = sort === "price-asc" ? 1 : -1;
    shown.sort((a, b) => (a.price - b.price) * direction);
  }

  return (
    <>
      <FiltersSidebar filters={filters} onChange={setFilters} />
      <ProductGrid count={shown.length} sort={sort} onSortChange={setSort}>
        {shown.map(({ id, href, image, brand, price, city, postedAgo, condition, delivery }) => (
          <ProductCard
            key={id}
            href={href}
            image={image}
            brand={brand}
            price={price}
            city={city}
            postedAgo={postedAgo}
            condition={condition}
            delivery={delivery}
          />
        ))}
        {shown.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-16 text-center text-sm text-brand-ink/60">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
              <SearchX className="size-7" aria-hidden />
            </span>
            Няма обяви, които отговарят на избраните филтри.
            <button
              type="button"
              onClick={() => setFilters(noFilters)}
              className="cursor-pointer font-semibold text-brand-rose underline underline-offset-4 transition-colors hover:text-brand"
            >
              Изчисти филтрите
            </button>
          </div>
        )}
      </ProductGrid>
    </>
  );
}
