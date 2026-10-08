"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Heart, MapPin, Pencil, Phone, SearchX, Tag, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import FiltersSidebar from "@/components/FiltersSidebar";
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
  description: string;
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
  // Called after the heart was taken off, for lists that show only the marked posts.
  onUnfavorite?: () => void;
};

// One post: the picture on the left; beside it the category with the heart across from it, what
// is wanted, and at the bottom the author with the button for getting in touch.
export function RequestCard({ request, onUnfavorite }: RequestCardProps) {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const [favorite, setFavorite] = useState(request.favorite);
  const [phone, setPhone] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();

  const details = [
    { icon: Tag, label: "Бюджет", value: request.budget === null ? "" : `До ${priceFormat.format(request.budget)}` },
    { icon: MapPin, label: "Град", value: request.city },
    { icon: Clock, label: "Публикувана", value: request.postedAgo },
  ].filter(({ value }) => value);

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

  // The number is asked from the server only now, and only for somebody signed in.
  const showPhone = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/requests/${request.id}`);
      const result = await response.json();
      if (response.ok) setPhone(result.phone);
      else setError(result.message);
    } catch {
      setError("Не успяхме да покажем номера. Опитай отново.");
    }
    setBusy(false);
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
    <article className="flex gap-4 rounded-2xl border border-black/5 bg-white p-3">
      <div className="relative min-h-36 w-28 shrink-0 self-stretch overflow-hidden rounded-xl bg-brand-pale sm:w-36">
        {request.image ? (
          <Image src={request.image} alt="" fill sizes="144px" className="object-cover" />
        ) : (
          <Image src="/images/logo.svg" alt="" fill sizes="144px" className="p-7 opacity-70" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-brand-ink/80">
            {request.categoryLabel}
          </span>
          <button
            type="button"
            aria-label={favorite ? "Премахни от любими" : "Добави в любими"}
            aria-pressed={favorite}
            onClick={toggleFavorite}
            className="-mt-1 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-brand-ink transition-colors hover:text-brand-rose"
          >
            <Heart className={`size-5 ${favorite ? "fill-red-800 text-red-800" : ""}`} aria-hidden />
          </button>
        </div>

        <h3 className="mt-2 text-base leading-snug font-bold wrap-break-word text-brand-ink">{request.title}</h3>
        <p title={request.description} className="mt-1 line-clamp-2 text-sm leading-5 wrap-break-word text-brand-ink/70">
          {request.description}
        </p>

        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-ink/60">
          {details.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="size-3.5" aria-hidden />
              <span className="sr-only">{label}:</span>
              {value}
            </li>
          ))}
        </ul>

        {/* Pushed to the bottom, so the buttons of the cards in one row line up. */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="min-w-0 truncate text-sm font-medium text-brand-ink">{request.author}</span>

          {request.own ? (
            confirming ? (
              <span className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={remove}
                  className={`${smallButton} bg-red-600 text-white hover:bg-red-700`}
                >
                  {busy ? "Изтриване…" : "Да, изтрий"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                  className={`${smallButton} border border-black/10 text-brand-ink hover:border-brand-rose/50`}
                >
                  Отказ
                </button>
              </span>
            ) : (
              <span className="flex gap-2">
                <Link
                  href={`/request/${request.id}`}
                  className={`${smallButton} border border-brand-rose text-brand-rose hover:bg-brand-rose/10`}
                >
                  <Pencil className="size-4" aria-hidden />
                  Редактирай
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
              </span>
            )
          ) : phone ? (
            <a
              href={`tel:${phone.replaceAll(" ", "")}`}
              className={`${smallButton} border border-brand-rose text-brand-rose hover:bg-brand-rose/10`}
            >
              <Phone className="size-4" aria-hidden />
              {phone}
            </a>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={showPhone}
              className={`${smallButton} bg-brand-rose px-5 text-white hover:bg-brand`}
            >
              Свържи се
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
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
      <FiltersSidebar filters={filters} onChange={setFilters} />
      <ProductGrid
        count={shown.length}
        sort={sort}
        onSortChange={setSort}
        label="Публикации"
        countLabel={shown.length === 1 ? "Намерена публикация" : "Намерени публикации"}
        // The cards are wide, so two fit beside each other where listings fit three.
        gridClassName="grid gap-4 xl:grid-cols-2"
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
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
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
