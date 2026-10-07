import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Heart,
  MapPin,
  Package,
  Pencil,
  ShoppingBag,
  Tag,
} from "lucide-react";
import ProfileListings from "@/components/profile/ProfileListings";
import { profile, profileListings } from "@/data/profile";

export const metadata: Metadata = {
  title: "Моят профил",
};

const card = "rounded-2xl border border-black/5 bg-white";

const stats = [
  { label: "Активни обяви", value: profile.stats.active, icon: Package, tone: "bg-brand-rose/10 text-brand-ink" },
  { label: "Продадени", value: profile.stats.sold, icon: Tag, tone: "bg-brand-rose/10 text-brand-ink" },
  { label: "Архивирани", value: profile.stats.archived, icon: FileText, tone: "bg-zinc-100 text-brand-ink" },
  { label: "Любими", value: profile.stats.favorites, icon: Heart, tone: "bg-brand-rose/10 text-brand-rose" },
  { label: "Покупки", value: profile.stats.purchases, icon: ShoppingBag, tone: "bg-sky-50 text-sky-600" },
];

function Avatar({ name, className }: { name: string; className: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-pale font-bold text-brand ${className}`}
    >
      {name.charAt(0)}
    </span>
  );
}

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <section className={`${card} flex flex-col gap-5 p-5 md:flex-row md:items-center`}>
        <Avatar name={profile.name} className="size-28 text-4xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-bold text-brand-ink">{profile.name}</h1>
            <button
              type="button"
              aria-label="Редактирай името"
              className="cursor-pointer text-brand-ink/50 transition-colors hover:text-brand-rose"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </div>
          <p className="mt-1 text-sm text-brand-ink/60">@{profile.handle}</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-brand-ink/70">
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {profile.city}
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              Член от {profile.memberSince}
            </li>
          </ul>
          <Link
            href="/profile/settings"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-rose/10 px-4 text-sm font-semibold text-brand-rose transition-colors hover:bg-brand-rose/20"
          >
            <Pencil className="size-4" aria-hidden />
            Редактирай профила
          </Link>
        </div>

        <div className="rounded-xl bg-zinc-50 p-4 md:w-72">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-brand-ink">За мен</h2>
            <button
              type="button"
              aria-label="Редактирай „За мен“"
              className="cursor-pointer text-brand-ink/50 transition-colors hover:text-brand-rose"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-brand-ink/70">{profile.about}</p>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <li key={label} className={`${card} flex items-center gap-3 p-3`}>
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-lg leading-6 font-bold text-brand-ink">{value}</span>
              <span className="block truncate text-xs text-brand-ink/60">{label}</span>
            </span>
          </li>
        ))}
      </ul>

      <ProfileListings
        listings={profileListings}
        counts={{ active: profile.stats.active, sold: profile.stats.sold, archived: profile.stats.archived }}
      />
    </div>
  );
}