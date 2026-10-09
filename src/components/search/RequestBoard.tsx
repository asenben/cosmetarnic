"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Pencil, SearchX, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import FiltersSidebar, { activeFilterCount } from "@/components/FiltersSidebar";
import ProductGrid, { type SortOrder } from "@/components/ProductGrid";
import { PRICE_MAX, noFilters, type Filters } from "@/components/SortBar";

// A "Търся" post as the page shows it: what somebody is looking for.
export type BoardRequest = {
  id: string;
  title: string;
  // The category's value, which the filter matches on, and its name, which is shown.
  category: string;
  categoryLabel: string;
  condition: "new" | "used" | "any";
  // The most the person would pay, in euro; null when they did not say.
  budget: number | null;
  city: string;
  // The address of the product's picture, if the author added one.
  image: string | null;
  postedAgo: string;
  // The author's username.
  author: string;
  // Whether the post is the signed-in user's own.
  own: boolean;
  // Whether the signed-in user marked it with the heart.
  favorite: boolean;
};

// The label beside the name, in the colours a listing's card uses for its condition.
const conditions = {
  new: { label: "Ново", className: "bg-emerald-50 text-emerald-700" },
  used: { label: "Използвано", className: "bg-amber-100 text-amber-800" },
  any: { label: "Ново или използвано", className: "bg-zinc-100 text-zinc-700" },
};

const priceFormat = new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" });

function matches(request: BoardRequest, filters: Filters) {
  if (filters.categories.length > 0 && !filters.categories.includes(request.category)) return false;
  // Somebody who takes either condition matches both choices.
  if (filters.condition !== "all" && request.condition !== "any" && request.condition !== filters.condition) {
    return false;
  }
  // The price filter is compared with the budget; posts without one fit any price.
  if (request.budget !== null) {
    if (request.budget < filters.priceMin) return false;
    if (filters.priceMax < PRICE_MAX && request.budget > filters.priceMax) return false;
  }
  if (filters.cities.length > 0 && !filters.cities.includes(request.city)) return false;
  return true;
}

const smallButton =
  "flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-60";

type RequestCardProps = {
  request: BoardRequest;
  // Shows the author the buttons for editing and deleting their post. Only the "Търся" page in
  // the profile does; everywhere else a post is just shown.
  manageable?: boolean;
  // Called after the heart was taken off, for lists that show only the marked posts.
  onUnfavorite?: () => void;
};

// One post, as a card like a listing's: the picture, which opens the post's own page, with the
// heart on it; under it the same rows as on a listing's card: what is wanted with the condition
// beside it, the budget, then the town and the time. The category, the description, the author
// and the way to get in touch are on the post's page.
export function RequestCard({ request, manageable = false, onUnfavorite }: RequestCardProps) {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const [favorite, setFavorite] = useState(request.favorite);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const condition = conditions[request.condition];
  const budget = request.budget === null ? "По договаряне" : priceFormat.format(request.budget);

  const toggleFavorite = async () => {
    // Signed-out visitors get the login form instead.
    if (!requireAuth()) return;
    const next = !favorite;
    // The heart changes at once and goes back if the server did not accept the change.
    setFavorite(next);
    try {
      const response = await fetch(`/api/requests/${request.id}/favorite`, { method: next ? "PUT" : "DELETE" });
      if (!response.ok) return setFavorite(!next);
      if (!next) onUnfavorite?.();
    } catch {
      setFavorite(!next);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/requests/${request.id}`, { method: "DELETE" });
      // 404 means it is gone already, e.g. deleted in another tab.
      if (response.ok || response.status === 404) return router.refresh();
      setError((await response.json()).message);
    } catch {
      setError("Не успяхме да изтрием публикацията. Опитай отново.");
    }
    setBusy(false);
  };

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white transition-shadow has-[a:hover]:shadow-lg has-[a:hover]:shadow-brand-ink/10 listview:flex-row">
      <div className="relative aspect-4/5 shrink-0 listview:m-2.5 listview:aspect-auto listview:min-h-28 listview:w-24 listview:sm:w-36">
        {/* Only the picture opens the post; the details under it are not a link. */}
        <Link
          href={`/search/${request.id}`}
          aria-label={`${request.title}, ${budget}`}
          className="group/image relative block size-full overflow-hidden bg-brand-pale listview:rounded-xl"
        >
          {request.image ? (
            // The picture fills the frame from its middle, with nothing empty around it.
            <Image
              src={request.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover object-center transition-transform duration-300 group-hover/image:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-xs font-medium text-brand-ink/60">
              <Image src="/images/logo.svg" alt="" width={64} height={64} className="size-16 rounded-full opacity-80" />
              <span className="listview:hidden">Няма изображение</span>
            </div>
          )}
        </Link>

        <button
          type="button"
          aria-label={favorite ? "Премахни от любими" : "Добави в любими"}
          aria-pressed={favorite}
          onClick={toggleFavorite}
          className="absolute right-3 bottom-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink shadow-sm transition-colors hover:text-brand-rose listview:right-1.5 listview:bottom-1.5"
        >
          <Heart className={`size-4.5 ${favorite ? "fill-red-800 text-red-800" : ""}`} aria-hidden />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 listview:justify-center">
        <div className="flex items-center justify-between gap-2">
          <h3 title={request.title} className="min-w-0 truncate text-sm font-semibold text-brand-ink listview:text-lg">
            {request.title}
          </h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${condition.className}`}>
            {condition.label}
          </span>
        </div>

        <p className="text-base font-bold text-brand-ink listview:text-xl">{budget}</p>

        <div className="flex items-center justify-between gap-2 text-xs text-brand-ink/60">
          <span className="min-w-0 truncate">{request.city}</span>
          <span className="shrink-0">{request.postedAgo}</span>
        </div>

        {/* The author's buttons, on the "Търся" page of the profile only. */}
        {manageable && request.own && (
          <div className="pt-1.5">
            {confirming ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={remove}
                  className={`${smallButton} flex-1 bg-red-600 text-white hover:bg-red-700`}
                >
                  {busy ? "Изтриване…" : "Да, изтрий"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                  className={`${smallButton} flex-1 border border-black/10 text-brand-ink hover:border-brand-rose/50`}
                >
                  Отказ
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href={`/request/${request.id}`}
                  className={`${smallButton} min-w-0 flex-1 border border-brand-rose text-brand-rose hover:bg-brand-rose/10`}
                >
                  <Pencil className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">Редактирай</span>
                </Link>
                <button
                  type="button"
                  aria-label="Изтрий публикацията"
                  title="Изтрий публикацията"
                  onClick={() => setConfirming(true)}
                  className={`${smallButton} border border-red-600/40 px-2.5 text-red-600 hover:bg-red-600/10`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            )}
            {error && (
              <p role="alert" className="mt-2 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// The "Търся" page: everybody's posts with the same filters, sorting and views as the marketplace.
// Writing a post is done from the profile (/profile/search). `requests` arrive newest first.
export default function RequestBoard({ requests }: { requests: BoardRequest[] }) {
  const [filters, setFilters] = useState(noFilters);
  const [sort, setSort] = useState<SortOrder>("newest");
  // Whether the filters cover the page, on the narrow screens where they are not at its side.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const shown = requests.filter((request) => matches(request, filters));
  if (sort !== "newest") {
    const direction = sort === "price-asc" ? 1 : -1;
    // Posts without a budget go last whichever way the rest are ordered.
    shown.sort((a, b) => {
      if (a.budget === null || b.budget === null) return Number(a.budget === null) - Number(b.budget === null);
      return (a.budget - b.budget) * direction;
    });
  }

  return (
    <>
      <FiltersSidebar filters={filters} onChange={setFilters} open={filtersOpen} onOpenChange={setFiltersOpen} />
      <ProductGrid
        count={shown.length}
        sort={sort}
        onSortChange={setSort}
        label="Публикации"
        countLabel={shown.length === 1 ? "Намерена публикация" : "Намерени публикации"}
        filters={{ active: activeFilterCount(filters), onOpen: () => setFiltersOpen(true) }}
      >
        {shown.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}

        {shown.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-3 px-4 py-16 text-center text-sm text-brand-ink/60">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
              <SearchX className="size-7" aria-hidden />
            </span>
            {requests.length === 0 ? (
              "Все още няма публикации в „Търся“."
            ) : (
              <>
                Няма публикации, които отговарят на избраните филтри.
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

// The marked posts on the "Любими" page. A post leaves the list as soon as its heart is taken off.
type FavoriteRequestsProps = {
  requests: BoardRequest[];
  // What to say once the last heart is taken off, when nothing else is shown on the page.
  emptyNote?: string;
};

export function FavoriteRequests({ requests, emptyNote }: FavoriteRequestsProps) {
  const [removed, setRemoved] = useState<string[]>([]);
  const shown = requests.filter(({ id }) => !removed.includes(id));
  if (shown.length === 0) {
    // Nothing was marked to begin with: the page's own note covers that.
    if (requests.length === 0 || !emptyNote) return null;
    return <p className="py-16 text-center text-sm text-brand-ink/60">{emptyNote}</p>;
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold tracking-wider text-brand-ink uppercase">Търсени продукти ({shown.length})</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onUnfavorite={() => setRemoved((ids) => [...ids, request.id])}
          />
        ))}
      </div>
    </section>
  );
}
