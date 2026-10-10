"use client";

import Image from "next/image";
import { useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  MapPin,
  Palette,
  Phone,
  Sparkles,
  Tag,
  Package,
  Truck,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFavorite } from "@/components/FavoritesProvider";
import MessageButton from "@/components/messages/MessageButton";
import type { ProductDetails } from "@/data/product";
import { formatPrice } from "@/lib/format";

const conditionLabels = { new: "Ново", used: "Използвано" };

const deliveryLabels = {
  // Short, so that the ways fit beside "Изпращане"; the map pin says the rest.
  pickup: "Лично",
  speedy: "Спиди",
  econt: "Еконт",
  boxnow: "BoxNow",
  pigeon: "Pigeon",
};

const phoneButton =
  "mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-rose text-sm font-semibold text-brand-rose transition-colors hover:bg-brand-rose/10";

export default function ProductSidebar({ product }: { product: ProductDetails }) {
  const { title, brand, price, city, postedAgo, condition, color, phone, delivery = [], sellerProfile: seller } = product;

  const { requireAuth } = useAuth();
  const { favorite, toggleFavorite } = useFavorite(product.id);
  const [phoneVisible, setPhoneVisible] = useState(false);

  const specs = [
    { icon: Tag, label: "Марка", value: brand },
    { icon: Sparkles, label: "Състояние", value: conditionLabels[condition] },
    { icon: Palette, label: "Цвят", value: color },
    { icon: CalendarDays, label: "Публикувана", value: postedAgo },
    // The colour is optional in the listing form.
  ].filter(({ value }) => value);

  return (
    <aside className="space-y-5">
      <section className="rounded-2xl border border-black/5 bg-white">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-lg leading-snug font-bold wrap-break-word text-brand-ink">{title}</h1>
            <button
              type="button"
              aria-label={favorite ? "Премахни от любими" : "Добави в любими"}
              aria-pressed={favorite}
              onClick={toggleFavorite}
              className="-mt-1.5 -mr-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-brand-ink transition-colors hover:text-brand-rose"
            >
              <Heart className={`size-5.5 ${favorite ? "fill-red-800 text-red-800" : ""}`} aria-hidden />
            </button>
          </div>
          <p className="mt-1 text-sm text-brand-ink/60">
            {conditionLabels[condition]} · <span className="font-medium text-brand-rose">{brand}</span>
          </p>
          <p className="mt-4 text-2xl font-bold text-brand-ink">{formatPrice(price)}</p>
        </div>

        <dl className="border-t border-black/5 px-5">
          {specs.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-black/5 py-3 text-sm"
            >
              <dt className="flex items-center gap-2.5 text-brand-ink/60">
                <Icon className="size-4 text-brand-rose" aria-hidden />
                {label}
              </dt>
              <dd className="text-right font-semibold whitespace-nowrap text-brand-ink">{value}</dd>
            </div>
          ))}
          {/* Each way of handing over with its own mark: a map pin for meeting in person, a parcel
              for a courier. Smaller on phones; they go on a second line when many are offered. */}
          {delivery.length > 0 && (
            <div className="flex items-center justify-between gap-2 py-3 text-sm sm:gap-4">
              <dt className="flex shrink-0 items-center gap-2.5 text-brand-ink/60">
                <Truck className="size-4 text-brand-rose" aria-hidden />
                Изпращане
              </dt>
              <dd>
                <ul className="flex flex-wrap justify-end gap-x-2 gap-y-1 text-[0.6875rem] font-semibold text-brand-ink sm:gap-x-3.5 sm:text-sm">
                  {delivery.map((key) => {
                    const Icon = key === "pickup" ? MapPin : Package;
                    return (
                      <li
                        key={key}
                        title={key === "pickup" ? "Лично предаване" : undefined}
                        className="flex items-center gap-1 whitespace-nowrap sm:gap-1.5"
                      >
                        <Icon className="size-3.5 shrink-0 text-brand-ink/60 sm:size-4" aria-hidden />
                        {deliveryLabels[key]}
                      </li>
                    );
                  })}
                </ul>
              </dd>
            </div>
          )}
        </dl>

        <div className="border-t border-black/5 p-5">
          <MessageButton target={{ listingId: product.id }} />

          {phoneVisible ? (
            <a href={`tel:${phone.replaceAll(" ", "")}`} className={phoneButton}>
              <Phone className="size-4.5" aria-hidden />
              {phone}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (requireAuth()) setPhoneVisible(true);
              }}
              className={phoneButton}
            >
              <Phone className="size-4.5" aria-hidden />
              Покажи номер
            </button>
          )}

          <div className="relative mt-3 flex h-14 items-center gap-2.5 overflow-hidden rounded-xl bg-zinc-100 px-4 text-sm font-medium text-brand-ink">
            {/* Decorative street map that fades in from the left; it is not the real location. */}
            <svg
              aria-hidden
              viewBox="0 0 200 56"
              preserveAspectRatio="xMaxYMid slice"
              className="absolute inset-y-0 right-0 h-full w-3/5 mask-l-from-40%"
              fill="none"
              strokeLinecap="round"
            >
              <path d="M120 -10 L200 70" className="stroke-emerald-200" strokeWidth="10" />
              <path d="M108 -10 L188 70" className="stroke-sky-300" strokeWidth="5" />
              <path d="M60 14 Q100 20 150 60" className="stroke-emerald-200" strokeWidth="4" />
              <g className="stroke-white" strokeWidth="3">
                <path d="M-10 40 L210 8" />
                <path d="M20 -10 L90 70" />
                <path d="M70 -10 L40 70" />
                <path d="M140 -10 L100 70" />
                <path d="M-10 10 L80 60" />
                <path d="M150 70 L210 30" />
              </g>
            </svg>
            <MapPin className="relative size-5 shrink-0" aria-hidden />
            <span className="relative">{city}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="text-base font-bold text-brand-ink">Продавач</h2>
        <button type="button" className="mt-3 flex w-full cursor-pointer items-center gap-3 text-left">
          {seller.avatar ? (
            <Image src={seller.avatar} alt="" width={56} height={56} className="size-14 rounded-full object-cover" />
          ) : (
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-pale text-lg font-bold text-brand"
            >
              {seller.name.charAt(0)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-brand-ink">{seller.name}</span>
            <span className="block truncate text-xs text-brand-ink/60">@{seller.handle}</span>
            <span className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-ink/60">
              <CalendarDays className="size-4" aria-hidden />
              Член от {seller.memberSince}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-brand-ink/60" aria-hidden />
        </button>

        <button
          type="button"
          className="mt-4 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-3 text-left text-sm text-brand-ink transition-colors hover:bg-brand-rose/10"
        >
          <span className="font-medium">Други обяви от този продавач</span>
          <span className="flex items-center gap-2 text-brand-ink/60">
            {seller.listings}
            <ChevronRight className="size-4" aria-hidden />
          </span>
        </button>
      </section>
    </aside>
  );
}
