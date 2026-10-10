"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type SubmitEvent } from "react";
import { Search, X } from "lucide-react";
import type { SearchResult } from "@/app/api/search/route";
import { formatPrice } from "@/lib/format";

// How long to wait after the last keystroke before asking the server.
const DELAY_MS = 200;

// The search field in the navigation. While the visitor types a brand, a category, a product's
// name or several of them, the listings found so far are offered in a list underneath; Enter
// opens the marketplace with all of them.
type SearchBoxProps = {
  // How the box sits among its neighbours; the default fits the top bar of wide screens.
  className?: string;
  // Full width with a white field, as on phones, instead of the grey field of the top bar.
  wide?: boolean;
};

export default function SearchBox({
  className = "flex min-w-0 flex-1 justify-center md:grow-0 md:basis-md",
  wide = false,
}: SearchBoxProps) {
  // The phone layout and the wide one each have a search box, so the list's id cannot be fixed.
  const listId = useId();
  const router = useRouter();
  const [query, setQuery] = useState("");
  // The listings found for `found.query`, or null before the first answer has arrived.
  const [found, setFound] = useState<{ query: string; results: SearchResult[] } | null>(null);
  const [open, setOpen] = useState(false);
  // -1 while nothing is highlighted, so Enter opens all the results.
  const [activeIndex, setActiveIndex] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Counts the requests, so an answer that arrives late does not replace a newer one.
  const latest = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const text = query.trim();
  const results = found && text ? found.results : [];
  const listOpen = open && text !== "" && found !== null;

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const onType = (value: string) => {
    setQuery(value);
    setOpen(true);
    setActiveIndex(-1);
    clearTimeout(timer.current);
    const request = ++latest.current;
    const wanted = value.trim();
    if (!wanted) return;

    timer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(wanted)}`);
        if (!response.ok || request !== latest.current) return;
        setFound({ query: wanted, results: (await response.json()).results });
      } catch {
        // Nothing is offered while the connection is down; Enter still opens the marketplace.
      }
    }, DELAY_MS);
  };

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    close();
    const chosen = results[activeIndex];
    if (chosen) router.push(`/product/${chosen.id}`);
    else router.push(text ? `/?q=${encodeURIComponent(text)}` : "/");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") return close();
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const last = results.length - 1;
    if (last < 0) return;
    event.preventDefault();
    setOpen(true);
    setActiveIndex((index) => {
      if (event.key === "ArrowDown") return index >= last ? -1 : index + 1;
      return index < 0 ? last : index - 1;
    });
  };

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      // Closes the list when the focus leaves the field and the list, e.g. on a click elsewhere.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      className={`relative ${className}`}
    >
      <label
        className={`flex h-11 w-full items-center gap-3 px-4 transition-colors ${
          wide
            ? "rounded-xl border border-black/10 bg-white focus-within:border-brand-rose"
            : "max-w-md rounded-full bg-zinc-100 focus-within:bg-zinc-200/70"
        }`}
      >
        <Search className="size-5 shrink-0 text-brand-ink/60" aria-hidden />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => onType(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Търси обяви, продукти, марки..."
          aria-label="Търсене"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          // The browser's own clear button is hidden; the red one after the field replaces it.
          className="w-full min-w-0 bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-ink/50 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <button
            type="button"
            aria-label="Изчисти търсенето"
            onClick={(event) => {
              onType("");
              // Back to the field, so a new search can be typed straight away.
              event.currentTarget.parentElement?.querySelector("input")?.focus();
            }}
            className="-mr-1.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-600/10"
          >
            <X className="size-4" strokeWidth={2.5} aria-hidden />
          </button>
        )}
      </label>

      {listOpen && (
        <div
          id={listId}
          className={`absolute top-full z-30 mt-2 w-full ${wide ? "" : "max-w-md"} overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg shadow-brand-ink/10`}
        >
          {results.length > 0 ? (
            <>
              <ul role="listbox" aria-label="Намерени обяви" className="scrollbar-soft max-h-96 overflow-y-auto p-1.5">
                {results.map((result, index) => (
                  <li key={result.id} role="option" aria-selected={index === activeIndex}>
                    <Link
                      href={`/product/${result.id}`}
                      onClick={close}
                      className={`flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-brand-rose/10 ${
                        index === activeIndex ? "bg-brand-rose/10" : ""
                      }`}
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-brand-pale">
                        {result.image ? (
                          <Image src={result.image} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <Image src="/images/logo.svg" alt="" fill sizes="48px" className="p-2 opacity-80" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-brand-ink">{result.title}</span>
                        <span className="block truncate text-xs text-brand-ink/60">
                          <span className="font-medium text-brand-rose">{result.brand}</span> · {result.category}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-brand-ink">{formatPrice(result.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="submit"
                className="block w-full cursor-pointer border-t border-black/5 px-4 py-2.5 text-center text-sm font-semibold text-brand-rose transition-colors hover:bg-brand-rose/10"
              >
                Виж всички резултати
              </button>
            </>
          ) : (
            <p role="status" className="px-4 py-5 text-center text-sm text-brand-ink/60">
              Няма намерени обяви за „{found.query}“.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
