"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchX, X } from "lucide-react";
import FiltersSidebar, { activeFilterCount } from "@/components/FiltersSidebar";
import ProductCard, { type Product } from "@/components/ProductCard";
import ProductGrid, { type SortOrder } from "@/components/ProductGrid";
import { noFilters, type Filters } from "@/components/SortBar";

// A listing as the marketplace needs it: what its card shows, plus what the filters match on.
export type MarketplaceListing = Product & { categories: string[] };

function matches(listing: MarketplaceListing, filters: Filters) {
  if (filters.categories.length > 0 && !listing.categories.some((value) => filters.categories.includes(value))) return false;
  if (filters.condition !== "all" && listing.condition !== filters.condition) return false;
  // A price left at null does not limit anything (see Filters).
  if (filters.priceMin !== null && listing.price < filters.priceMin) return false;
  if (filters.priceMax !== null && listing.price > filters.priceMax) return false;
  if (filters.cities.length > 0 && !filters.cities.includes(listing.city)) return false;
  return true;
}

type MarketplaceProps = {
  listings: MarketplaceListing[];
  // The search the listings were found by, when the visitor came from the search field.
  search?: string;
  // What to say when there are no listings at all.
  emptyText?: string;
};

// The listings with the filters beside them. `listings` arrive newest first.
export default function Marketplace({
  listings,
  search = "",
  emptyText = "Все още няма публикувани обяви.",
}: MarketplaceProps) {
  const [filters, setFilters] = useState(noFilters);
  const [sort, setSort] = useState<SortOrder>("newest");
  // Whether the filters cover the page, on the narrow screens where they are not at its side.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const shown = listings.filter((listing) => matches(listing, filters));
  if (sort !== "newest") {
    const direction = sort === "price-asc" ? 1 : -1;
    shown.sort((a, b) => (a.price - b.price) * direction);
  }

  return (
    <>
      <FiltersSidebar filters={filters} onChange={setFilters} open={filtersOpen} onOpenChange={setFiltersOpen} />
      <ProductGrid
        count={shown.length}
        sort={sort}
        onSortChange={setSort}
        filters={{ active: activeFilterCount(filters), onOpen: () => setFiltersOpen(true) }}
        // Two listings across on phones, so more of them are seen at once, and four on wide screens.
        gridClassName="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
      >
        {search && (
          <p className="col-span-full flex flex-wrap items-center gap-2 text-sm text-brand-ink/60">
            Резултати за
            <Link
              href="/"
              aria-label={`Изчисти търсенето „${search}“`}
              className="flex items-center gap-1.5 rounded-full bg-brand-rose/10 py-1 pr-2 pl-3 font-semibold text-brand-rose transition-colors hover:bg-brand-rose/20"
            >
              {search}
              <X className="size-3.5" aria-hidden />
            </Link>
          </p>
        )}
        {shown.map(({ id, href, image, brand, price, city, postedAgo, condition, delivery }) => (
          <ProductCard
            key={id}
            id={id}
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
          <div className="col-span-full flex flex-col items-center gap-3 px-4 py-16 text-center text-sm text-brand-ink/60">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
              <SearchX className="size-7" aria-hidden />
            </span>
            {listings.length === 0 ? (
              search ? `Няма намерени обяви за „${search}“.` : emptyText
            ) : (
              <>
                Няма обяви, които отговарят на избраните филтри.
                <button
                  type="button"
                  onClick={() => setFilters(noFilters)}
                  className="cursor-pointer font-semibold text-brand-rose underline underline-offset-4 transition-colors hover:text-brand"
                >
                  Изчисти филтрите
                </button>
              </>
            )}
          </div>
        )}
      </ProductGrid>
    </>
  );
}
