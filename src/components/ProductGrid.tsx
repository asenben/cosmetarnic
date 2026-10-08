"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, ChevronDown, LayoutGrid, List } from "lucide-react";

const sortOptions = [
  { value: "newest", label: "Най-нови" },
  { value: "price-asc", label: "Ниска към висока" },
  { value: "price-desc", label: "Висока към ниска" },
] as const;

export type SortOrder = (typeof sortOptions)[number]["value"];

const views = [
  { value: "grid", label: "Изглед мрежа", icon: LayoutGrid },
  { value: "list", label: "Изглед списък", icon: List },
] as const;

type View = (typeof views)[number]["value"];

type ProductGridProps = {
  count?: number;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  // What the grid holds, for screen readers, and the words before the count. Both are about
  // listings unless a page shows something else in the grid.
  label?: string;
  countLabel?: string;
  // The classes that lay the cards out in the grid view, for cards of another shape than a listing's.
  gridClassName?: string;
  children?: ReactNode;
};

type SortDropdownProps = {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
};

function SortDropdown({ value, onChange }: SortDropdownProps) {
  const id = useId();
  const selectedIndex = sortOptions.findIndex((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  const openList = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const select = (index: number) => {
    onChange(sortOptions[index].value);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = sortOptions.length - 1;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) return openList();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((index) => Math.min(last, Math.max(0, index + step)));
        break;
      }
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? 0 : last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) select(activeIndex);
        else openList();
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        role="combobox"
        aria-label="Подреждане"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={`flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-white pr-2.5 pl-3 text-sm font-medium text-brand-ink transition-colors outline-none focus-visible:border-brand-rose ${
          open ? "border-brand-rose" : "border-black/10 hover:border-brand-rose/50"
        }`}
      >
        {sortOptions[selectedIndex].label}
        <ChevronDown
          className={`size-4 text-brand-ink/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <ul
        id={`${id}-list`}
        role="listbox"
        aria-label="Подреждане"
        className={`absolute right-0 z-20 mt-2 min-w-full origin-top-right rounded-xl border border-black/5 bg-white p-1 shadow-lg shadow-brand-ink/10 transition duration-150 ease-out motion-reduce:transition-none ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {sortOptions.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <li
              key={option.value}
              id={`${id}-${index}`}
              role="option"
              aria-selected={selected}
              // Keep focus on the button so its blur doesn't close the list before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(index)}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                selected ? "font-semibold text-brand-rose" : "text-brand-ink"
              } ${index === activeIndex ? "bg-brand-rose/10" : ""}`}
            >
              {option.label}
              <Check className={`size-4 ${selected ? "" : "invisible"}`} aria-hidden />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ProductGrid({
  count = 0,
  sort,
  onSortChange,
  label = "Обяви",
  countLabel = count === 1 ? "Намерена обява" : "Намерени обяви",
  gridClassName = "grid grid-cols-2 gap-4 lg:grid-cols-3",
  children,
}: ProductGridProps) {
  const [view, setView] = useState<View>("grid");

  return (
    <section aria-label={label} className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-ink">
          {countLabel}
          <span className="min-w-7 rounded-full bg-brand-rose/10 px-2.5 py-0.5 text-center font-semibold text-brand-rose tabular-nums">
            {count}
          </span>
        </p>

        <div className="flex items-center gap-3">
          <SortDropdown value={sort} onChange={onSortChange} />

          <div role="group" aria-label="Изглед" className="flex items-center gap-1">
            {views.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                  view === value
                    ? "bg-brand-rose/10 text-brand-rose"
                    : "text-brand-ink/50 hover:text-brand-rose"
                }`}
              >
                <Icon className="size-4.5" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        // The cards read this to lay themselves out as rows in the list view.
        data-view={view}
        className={`mt-4 ${
          view === "grid" ? gridClassName : "flex flex-col gap-4"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
