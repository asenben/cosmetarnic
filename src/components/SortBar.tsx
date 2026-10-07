"use client";

import { useState, type ReactNode } from "react";
import { MapPin, Search, type LucideIcon } from "lucide-react";
import { categories, cities } from "@/data/listingOptions";

const conditions = [
  { value: "all", label: "Всички" },
  { value: "new", label: "Ново" },
  { value: "used", label: "Използвано" },
] as const;

export const PRICE_MIN = 0;
// The top of the slider. Left there, it means "no upper limit", so dearer listings still show.
export const PRICE_MAX = 500;

// What the visitor has chosen in the sidebar. Empty lists mean "any".
export type Filters = {
  categories: string[];
  condition: (typeof conditions)[number]["value"];
  priceMin: number;
  priceMax: number;
  cities: string[];
};

export const noFilters: Filters = {
  categories: [],
  condition: "all",
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  cities: [],
};

type ListFilterProps = { selected: string[]; onChange: (selected: string[]) => void };

const rangeThumb =
  "pointer-events-none absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent outline-none " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-rose [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-rose [&::-moz-range-thumb]:shadow " +
  "focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-brand-rose/40";

const textInput =
  "h-9 w-full min-w-0 rounded-lg border border-black/10 bg-white text-sm text-brand-ink outline-none transition-colors placeholder:text-brand-ink/40 focus:border-brand-rose";

const noSpinner =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

type OptionRowProps = {
  icon?: LucideIcon;
  label: string;
  active: boolean;
  children: ReactNode;
};

function OptionRow({ icon: Icon, label, active, children }: OptionRowProps) {
  return (
    <label
      className={`-mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors ${
        active ? "bg-brand-rose/10 font-medium text-brand-rose" : "text-brand-ink hover:bg-zinc-50"
      }`}
    >
      {Icon && (
        <Icon
          className={`size-4 shrink-0 transition-colors ${active ? "text-brand-rose" : "text-brand-lilac"}`}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {children}
    </label>
  );
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function CategoryFilter({ selected, onChange }: ListFilterProps) {
  return (
    <div>
      {categories.map(({ value, label, icon }) => (
        <OptionRow key={value} icon={icon} label={label} active={selected.includes(value)}>
          <input
            type="checkbox"
            name="category"
            value={value}
            checked={selected.includes(value)}
            onChange={() => onChange(toggle(selected, value))}
            className="size-4 shrink-0 cursor-pointer accent-brand-rose"
          />
        </OptionRow>
      ))}
    </div>
  );
}

type ConditionFilterProps = { selected: Filters["condition"]; onChange: (condition: Filters["condition"]) => void };

export function ConditionFilter({ selected, onChange }: ConditionFilterProps) {
  return (
    <div role="radiogroup" aria-label="Състояние">
      {conditions.map(({ value, label }) => (
        <OptionRow key={value} label={label} active={selected === value}>
          <input
            type="radio"
            name="condition"
            value={value}
            checked={selected === value}
            onChange={() => onChange(value)}
            className="size-4 shrink-0 cursor-pointer accent-brand-rose"
          />
        </OptionRow>
      ))}
    </div>
  );
}

type PriceFilterProps = { min: number; max: number; onChange: (min: number, max: number) => void };

export function PriceFilter({ min, max, onChange }: PriceFilterProps) {
  const changeMin = (value: number) => onChange(Math.min(Math.max(value || PRICE_MIN, PRICE_MIN), max), max);
  const changeMax = (value: number) => onChange(min, Math.max(Math.min(value || PRICE_MIN, PRICE_MAX), min));

  const percent = (value: number) => ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <div>
      <div className="flex justify-between text-xs text-brand-ink/60">
        <span>{PRICE_MIN} €</span>
        <span>{PRICE_MAX} €</span>
      </div>

      <div className="relative mt-2 h-4">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-rose"
          style={{ left: `${percent(min)}%`, right: `${100 - percent(max)}%` }}
        />
        <input
          type="range"
          aria-label="Минимална цена"
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={min}
          onChange={(event) => changeMin(event.target.valueAsNumber)}
          // Keep the min thumb reachable when both thumbs sit at the right end.
          className={`${rangeThumb} ${min > PRICE_MAX / 2 ? "z-10" : ""}`}
        />
        <input
          type="range"
          aria-label="Максимална цена"
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={max}
          onChange={(event) => changeMax(event.target.valueAsNumber)}
          className={rangeThumb}
        />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <label className="min-w-0 flex-1 text-xs text-brand-ink/60">
          От
          <span className="relative mt-1 block">
            <input
              type="number"
              name="price_min"
              min={PRICE_MIN}
              max={max}
              value={min}
              onChange={(event) => changeMin(event.target.valueAsNumber)}
              className={`${textInput} ${noSpinner} pr-7 pl-3`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">€</span>
          </span>
        </label>
        <span className="pb-2 text-brand-ink/40" aria-hidden>
          –
        </span>
        <label className="min-w-0 flex-1 text-xs text-brand-ink/60">
          До
          <span className="relative mt-1 block">
            <input
              type="number"
              name="price_max"
              min={min}
              max={PRICE_MAX}
              value={max}
              onChange={(event) => changeMax(event.target.valueAsNumber)}
              className={`${textInput} ${noSpinner} pr-7 pl-3`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">€</span>
          </span>
        </label>
      </div>
    </div>
  );
}

export function CityFilter({ selected, onChange }: ListFilterProps) {
  // Only narrows the list of towns to pick from; it is not a filter on the listings itself.
  const [query, setQuery] = useState("");

  const visible = cities.filter((city) => city.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <label className="relative block">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-rose"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Търси град..."
          aria-label="Търси град"
          className={`${textInput} pr-3 pl-9`}
        />
      </label>

      <div className="mt-2">
        {visible.map((city) => (
          <OptionRow key={city} icon={MapPin} label={city} active={selected.includes(city)}>
            <input
              type="checkbox"
              name="city"
              value={city}
              checked={selected.includes(city)}
              onChange={() => onChange(toggle(selected, city))}
              className="size-4 shrink-0 cursor-pointer accent-brand-rose"
            />
          </OptionRow>
        ))}
        {visible.length === 0 && <p className="py-2 text-sm text-brand-ink/50">Няма намерен град.</p>}
      </div>
    </div>
  );
}
