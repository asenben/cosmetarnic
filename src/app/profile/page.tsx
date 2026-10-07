import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Heart,
  Package,
  Pencil,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { redirect } from "next/navigation";
import ProfileListings, { type ProfileListing } from "@/components/profile/ProfileListings";
import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";

export const metadata: Metadata = {
  title: "Моят профил",
};

const card = "rounded-2xl border border-black/5 bg-white";

const monthAndYear = new Intl.DateTimeFormat("bg-BG", { month: "long", year: "numeric" });

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

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [account] = await sql`select created_at from users where id = ${user.id}`;
  const memberSince = monthAndYear.format(new Date(account.created_at));

  // Listings, favourites and purchases are not stored yet, so a new account starts with none.
  const listings: ProfileListing[] = [];
  const counts = { active: 0, sold: 0, archived: 0 };
  const stats = [
    { label: "Активни обяви", value: counts.active, icon: Package, tone: "bg-brand-rose/10 text-brand-ink" },
    { label: "Продадени", value: counts.sold, icon: Tag, tone: "bg-brand-rose/10 text-brand-ink" },
    { label: "Архивирани", value: counts.archived, icon: FileText, tone: "bg-zinc-100 text-brand-ink" },
    { label: "Любими", value: 0, icon: Heart, tone: "bg-brand-rose/10 text-brand-rose" },
    { label: "Покупки", value: 0, icon: ShoppingBag, tone: "bg-sky-50 text-sky-600" },
  ];

  return (
    <div className="space-y-4">
      <section className={`${card} flex flex-col gap-5 p-5 md:flex-row md:items-center`}>
        <Avatar name={user.username} className="size-28 text-4xl uppercase" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-bold text-brand-ink">{user.username}</h1>
            <button
              type="button"
              aria-label="Редактирай името"
              className="cursor-pointer text-brand-ink/50 transition-colors hover:text-brand-rose"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </div>
          <p className="mt-1 truncate text-sm text-brand-ink/60">{user.email}</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-brand-ink/70">
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              Член от {memberSince}
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
          <p className="mt-2 text-sm leading-6 text-brand-ink/50">Все още няма описание.</p>
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

      <ProfileListings listings={listings} counts={counts} />
    </div>
  );
}