"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Heart, MapPin, Truck } from "lucide-react";
import { useFavorite } from "@/components/FavoritesProvider";

const conditions = {
  new: { label: "Ново", className: "bg-emerald-50 text-emerald-700" },
  used: { label: "Използвано", className: "bg-amber-100 text-amber-800" },
};

// The ways a seller can hand over the product, in the order the cards show them.
const couriers = { speedy: "Спиди", econt: "Еконт" };
type Delivery = "pickup" | keyof typeof couriers;

// One entry for handing over in person and one for shipping, however many couriers are offered.
function deliveryBadges(delivery: Delivery[]) {
  const offered = (Object.keys(couriers) as (keyof typeof couriers)[]).filter((key) => delivery.includes(key));
  return [
    ...(delivery.includes("pickup") ? [{ key: "pickup", label: "Лично предаване", icon: MapPin }] : []),
    ...(offered.length > 0
      ? [{ key: "courier", label: offered.map((key) => couriers[key]).join(" / "), icon: Truck }]
      : []),
  ];
}

const priceFormat = new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" });

export type Product = {
  // The listing's id, which its heart is saved under.
  id: string;
  href: string;
  brand: string;
  price: number;
  city: string;
  postedAgo: string;
  condition: keyof typeof conditions;
  delivery?: Delivery[];
  image?: string;
};

export default function ProductCard({
  id,
  href,
  brand,
  price,
  city,
  postedAgo,
  condition,
  delivery = [],
  image,
}: Product) {
  const { favorite, toggleFavorite } = useFavorite(id);
  const { label: conditionLabel, className: conditionClass } = conditions[condition];

  return (
    // A container, so the card can tell when it is narrow (two across on a phone) and lay its
    // last row out to fit.
    <article className="@container relative overflow-hidden rounded-2xl border border-black/5 bg-white transition-shadow has-[a:hover]:shadow-lg has-[a:hover]:shadow-brand-ink/10 listview:flex">
      {/* Not a positioning anchor in the list view, so the heart there moves to the card's top right corner. */}
      {/* A tall frame, close to the shape of a photo taken with a phone held upright, so little
          of it is left outside. */}
      <div className="relative aspect-3/5 listview:static listview:m-2.5 listview:aspect-auto listview:w-24 listview:shrink-0 listview:sm:w-36">
        {/* Only the picture opens the listing; the details under it are not a link. */}
        <Link
          href={href}
          aria-label={`${brand}, ${priceFormat.format(price)}`}
          className="group/image relative block size-full overflow-hidden bg-brand-pale listview:rounded-xl"
        >
          {image ? (
            // The photo fills the frame from its middle, with nothing empty around it; whatever does
            // not fit at its edges is seen on the listing's own page.
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover object-center transition-transform duration-300 group-hover/image:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-xs font-medium text-brand-ink/60">
              <Image src="/images/logo.svg" alt="" width={64} height={64} className="size-16 rounded-full opacity-80" />
              Няма изображение
            </div>
          )}
        </Link>

        <button
          type="button"
          aria-label={favorite ? "Премахни от любими" : "Добави в любими"}
          aria-pressed={favorite}
          onClick={toggleFavorite}
          className="absolute top-3 right-3 z-10 flex size-9 cursor-pointer sm:top-auto sm:bottom-3 items-center justify-center rounded-full bg-white text-brand-ink shadow-sm listview:top-3 listview:right-4 listview:bottom-auto listview:size-10 listview:border listview:border-black/5 transition-colors hover:text-brand-rose"
        >
          <Heart className={`size-4.5 ${favorite ? "fill-red-800 text-red-800" : ""}`} aria-hidden />
        </button>
      </div>

      {/* In the list view the rows become one grid: name, price and city on the left, the time on
          the right under the heart, and the delivery options on a line of their own at the bottom. */}
      <div className="space-y-1.5 p-3 @max-[13rem]:space-y-1 @max-[13rem]:p-2.5 listview:grid listview:min-w-0 listview:flex-1 listview:grid-cols-[minmax(0,1fr)_auto] listview:content-center listview:gap-x-4 listview:gap-y-1 listview:py-3 listview:pr-4 listview:pl-1.5">
        <div className="flex items-center justify-between gap-2 listview:col-start-1 listview:row-start-1 listview:mb-0 listview:min-w-0 listview:justify-start listview:gap-3 listview:pr-10">
          <h3 className="min-w-0 truncate text-sm font-semibold text-brand-ink listview:text-lg">
            {brand}
          </h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${conditionClass}`}>
            {conditionLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 listview:contents">
          <p className="text-base font-bold text-brand-ink listview:col-start-1 listview:row-start-2 listview:text-xl">
            {priceFormat.format(price)}
          </p>
          <ul className="hidden items-center gap-1.5 text-brand-ink/50 sm:flex listview:col-span-2 listview:row-start-4 listview:mt-2 listview:flex-wrap listview:gap-x-4 listview:gap-y-1 listview:border-t listview:border-black/5 listview:pt-3 listview:text-sm listview:text-brand-ink">
            {deliveryBadges(delivery).map(({ key, label, icon: Icon }) => (
              <li
                key={key}
                title={label}
                className="listview:flex listview:items-center listview:gap-2 listview:not-first:border-l listview:not-first:border-black/10 listview:not-first:pl-4"
              >
                <Icon className="size-4 listview:size-5" aria-hidden />
                <span className="sr-only listview:not-sr-only">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* In a narrow card the town and the time each get a line, so neither is cut short. */}
        <div className="flex items-center justify-between gap-2 text-xs text-brand-ink/60 @max-[13rem]:flex-col @max-[13rem]:items-start @max-[13rem]:gap-0.5 listview:contents">
          <span className="flex min-w-0 items-center gap-1 sm:gap-1.5 listview:col-start-1 listview:row-start-3 listview:text-sm">
            <MapPin className="size-3.5 shrink-0 sm:hidden listview:block listview:size-4" aria-hidden />
            <span className="truncate">{city}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 sm:gap-1.5 listview:col-start-2 listview:row-start-3 listview:self-center">
            <Clock className="size-3 sm:hidden listview:block listview:size-3.5" aria-hidden />
            {postedAgo}
          </span>
        </div>
      </div>
    </article>
  );
}
