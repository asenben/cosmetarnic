"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { CategoryFilter, CityFilter, ConditionFilter, PriceFilter } from "@/components/SortBar";

const sections = [
  { id: "categories", title: "Категории", Content: CategoryFilter },
  { id: "condition", title: "Състояние", Content: ConditionFilter },
  { id: "price", title: "Цена", Content: PriceFilter },
  { id: "city", title: "Град", Content: CityFilter },
];

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

export default function FiltersSidebar() {
  // Bumping the key remounts the filters, which resets their selections.
  const [resetKey, setResetKey] = useState(0);

  return (
    <aside
      aria-label="Филтри"
      className="sticky top-6 hidden w-64 shrink-0 rounded-2xl border border-black/5 bg-white lg:block"
    >
      <div className="flex justify-end border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={() => setResetKey(resetKey + 1)}
          className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-brand-rose transition-colors hover:text-brand"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Изчисти всички
        </button>
      </div>

      {sections.map(({ id, title, Content }) => (
        <FilterSection key={id} title={title}>
          <Content key={resetKey} />
        </FilterSection>
      ))}
    </aside>
  );
}
