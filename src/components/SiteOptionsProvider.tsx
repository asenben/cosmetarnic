"use client";

import { createContext, use, type ReactNode } from "react";
import { categoryIcon } from "@/data/categoryIcons";
import type { Category } from "@/lib/categories";
import type { PriceRange } from "@/lib/options";

// What the administrator sets from the panel and the filters and forms are built from.
type SiteOptions = {
  categories: Category[];
  // The names of the towns that are offered, in order.
  cities: string[];
  // The ends of the price slider in the filters.
  priceRange: PriceRange;
};

const SiteOptionsContext = createContext<SiteOptions | null>(null);

// Hands the site's categories, towns and price range, read from the database when the page was
// rendered on the server, to the parts of the page that run in the browser.
export default function SiteOptionsProvider({ children, ...options }: SiteOptions & { children: ReactNode }) {
  return <SiteOptionsContext value={options}>{children}</SiteOptionsContext>;
}

function useSiteOptions() {
  const options = use(SiteOptionsContext);
  if (!options) throw new Error("The site's options are used outside <SiteOptionsProvider>");
  return options;
}

// The categories with their pictures ready to draw.
export function useCategories() {
  return useSiteOptions().categories.map(({ value, label, icon }) => ({ value, label, icon: categoryIcon(icon) }));
}

export function useCities() {
  return useSiteOptions().cities;
}

export function usePriceRange() {
  return useSiteOptions().priceRange;
}
