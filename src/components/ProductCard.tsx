"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Clock, Heart, MapPin, Truck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

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
  href,
  brand,
  price,
  city,
  postedAgo,
  condition,
  delivery = [],
  image,
}: Product) {
  const { requireAuth } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const { label: conditionLabel, className: conditionClass } = conditions[condition];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white transition-shadow hover:shadow-lg hover:shadow-brand-ink/10 listview:flex">
      {/* Not a positioning anchor in the list view, so the heart there moves to the card's top right corner. */}
      <div className="relative aspect-4/5 listview:static listview:m-2.5 listview:aspect-auto listview:w-24 listview:shrink-0 listview:sm:w-36">
        <div className="relative size-full overflow-hidden bg-brand-pale listview:rounded-xl">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-xs font-medium text-brand-ink/60">
              <Image src="/images/logo.svg" alt="" width={64} height={64} className="size-16 rounded-full opacity-80" />
              Няма изображение
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={favorite ? "Премахни от любими" : "Добави в любими"}
          aria-pressed={favorite}
          onClick={() => {
            if (requireAuth()) setFavorite(!favorite);
          }}
          className="absolute right-3 bottom-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink shadow-sm listview:top-3 listview:right-4 listview:bottom-auto listview:size-10 listview:border listview:border-black/5 transition-colors hover:text-brand-rose"
        >
          <Heart className={`size-4.5 ${favorite ? "fill-red-800 text-red-800" : ""}`} aria-hidden />
        </button>
      </div>

      {/* In the list view the rows become one grid: name, price and city on the left, the time on
          the right under the heart, and the delivery options on a line of their own at the bottom. */}
      <div className="space-y-1.5 p-3 listview:grid listview:min-w-0 listview:flex-1 listview:grid-cols-[minmax(0,1fr)_auto] listview:content-center listview:gap-x-4 listview:gap-y-1 listview:py-3 listview:pr-4 listview:pl-1.5">
        <div className="flex items-center justify-between gap-2 listview:col-start-1 listview:row-start-1 listview:mb-0 listview:min-w-0 listview:justify-start listview:gap-3 listview:pr-10">
          <h3 className="min-w-0 truncate text-sm font-semibold text-brand-ink listview:text-lg">
            {/* The stretched link makes the whole card clickable; the heart sits above it. */}
            <Link href={href} className="after:absolute after:inset-0">
              {brand}
            </Link>
          </h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${conditionClass}`}>
            {conditionLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 listview:contents">
          <p className="text-base font-bold text-brand-ink listview:col-start-1 listview:row-start-2 listview:text-xl">
            {priceFormat.format(price)}
          </p>
          <ul className="flex items-center gap-1.5 text-brand-ink/50 listview:col-span-2 listview:row-start-4 listview:mt-2 listview:flex-wrap listview:gap-x-4 listview:gap-y-1 listview:border-t listview:border-black/5 listview:pt-3 listview:text-sm listview:text-brand-ink">
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

        <div className="flex items-center justify-between gap-2 text-xs text-brand-ink/60 listview:contents">
          <span className="flex min-w-0 items-center gap-1.5 listview:col-start-1 listview:row-start-3 listview:text-sm">
            <MapPin className="hidden size-4 shrink-0 listview:block" aria-hidden />
            <span className="truncate">{city}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 listview:col-start-2 listview:row-start-3 listview:self-center">
            <Clock className="hidden size-3.5 listview:block" aria-hidden />
            {postedAgo}
          </span>
        </div>
      </div>
    </article>
  );
}
