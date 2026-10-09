"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, RotateCcw, X } from "lucide-react";
import {
  CategoryFilter,
  CityFilter,
  ConditionFilter,
  PriceFilter,
  noFilters,
  type Filters,
} from "@/components/SortBar";

type FilterSectionProps = {
  title: string;
  children?: ReactNode;
};

function FilterSection({ title, children }: FilterSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="border-t border-black/5 first:border-t-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-brand-ink transition-colors hover:text-brand-rose"
        >
          {title}
          <ChevronDown
            className={`size-4 text-brand-ink/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </h2>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className={`overflow-hidden ${open ? "" : "invisible"}`}>
          <div className="px-4 pb-4 empty:hidden">{children}</div>
        </div>
      </div>
    </section>
  );
}

type FiltersSidebarProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  // On narrow screens the panel covers the page while it is open; the "Филтри" button that opens
  // it is in the list's header (see ProductGrid). Wide screens always show the panel at the side.
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// How many of the four filters are narrowing the list, for the number on the "Филтри" button.
export const activeFilterCount = (filters: Filters) =>
  Number(filters.categories.length > 0) +
  Number(filters.condition !== "all") +
  Number(filters.priceMin !== noFilters.priceMin || filters.priceMax !== noFilters.priceMax) +
  Number(filters.cities.length > 0);

export default function FiltersSidebar({ filters, onChange, open, onOpenChange }: FiltersSidebarProps) {
  // Bumping the key also clears what was typed in the town search box.
  const [resetKey, setResetKey] = useState(0);

  // The page behind the open filters does not scroll.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <aside
      aria-label="Филтри"
      // One panel in two shapes: beside the list on wide screens, and over the whole page on
      // narrow ones while it is open.
      className={`bg-white lg:sticky lg:top-6 lg:z-auto lg:block lg:w-64 lg:shrink-0 lg:overflow-visible lg:rounded-2xl lg:border lg:border-black/5 ${
        open ? "fixed inset-0 z-50 overflow-y-auto overscroll-contain lg:inset-auto" : "hidden"
      }`}
    >
      {/* On narrow screens "Изчисти всички" is on the left with the cross across from it; at the
          side of wide screens it is alone, on the right. */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/5 bg-white px-4 py-3 lg:static lg:justify-end">
        <button
          type="button"
          onClick={() => {
            onChange(noFilters);
            setResetKey(resetKey + 1);
          }}
          className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-rose transition-colors hover:text-brand lg:text-xs"
        >
          <RotateCcw className="size-4 lg:size-3.5" aria-hidden />
          Изчисти всички
        </button>
        <button
          type="button"
          aria-label="Затвори филтрите"
          onClick={() => onOpenChange(false)}
          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-brand-ink transition-colors hover:text-brand-rose lg:hidden"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <FilterSection title="Категории">
        <CategoryFilter
          selected={filters.categories}
          onChange={(categories) => {
            onChange({ ...filters, categories });
            // Choosing a category is what the filters are mostly opened for: it shows the list.
            onOpenChange(false);
          }}
        />
      </FilterSection>
      <FilterSection title="Състояние">
        <ConditionFilter selected={filters.condition} onChange={(condition) => onChange({ ...filters, condition })} />
      </FilterSection>
      <FilterSection title="Цена">
        <PriceFilter
          min={filters.priceMin}
          max={filters.priceMax}
          onChange={(priceMin, priceMax) => onChange({ ...filters, priceMin, priceMax })}
        />
      </FilterSection>
      <FilterSection title="Град">
        <CityFilter key={resetKey} selected={filters.cities} onChange={(cities) => onChange({ ...filters, cities })} />
      </FilterSection>

      {/* The way back to the list on narrow screens, always within reach at the bottom. */}
      <div className="sticky bottom-0 border-t border-black/5 bg-white p-4 lg:hidden">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="h-12 w-full cursor-pointer rounded-xl bg-brand-rose text-sm font-semibold text-white transition-colors hover:bg-brand"
        >
          Покажи резултатите
        </button>
      </div>
    </aside>
  );
}
