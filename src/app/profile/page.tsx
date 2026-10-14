import type { Metadata } from "next";
import { FileText, Heart, Package, Pencil, ShoppingBag, Tag, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ContactCard from "@/components/profile/ContactCard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { getProfile } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import { formatAmount } from "@/lib/format";
import { countUserListings } from "@/lib/listings";
import { deliveryLabels } from "@/lib/listings/delivery";
import { getFavoriteIds } from "@/lib/listings/favorites";

export const metadata: Metadata = {
  title: "Моят профил",
};

const card = "rounded-2xl border border-black/5 bg-white";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [[account], profile, listingCounts, favoriteIds] = await Promise.all([
    sql`select created_at from users where id = ${user.id}`,
    getProfile(user.id),
    countUserListings(user.id),
    getFavoriteIds(user.id),
  ]);
  // The counts shown inside the profile card; the visitor can hide them in the settings.
  const highlights = [
    { label: "Активни обяви", value: listingCounts.active, icon: FileText },
    { label: "Продадени", value: listingCounts.sold, icon: ShoppingBag },
    { label: "Любими", value: favoriteIds.length, icon: Heart },
  ];
  // The row under the card. Purchases are not stored yet, so every account has none.
  const stats = [
    { label: "Активни обяви", value: listingCounts.active, icon: Package },
    { label: "Продадени", value: listingCounts.sold, icon: Tag },
    { label: "Любими", value: favoriteIds.length, icon: Heart },
    { label: "Покупки", value: 0, icon: ShoppingBag },
  ];

  return (
    <div className="space-y-4">
      <section className={`${card} p-5 shadow-sm shadow-brand-ink/5 sm:p-8`}>
        <ProfileHeader
          username={user.username}
          avatar={user.avatar}
          city={profile.city}
          memberSince={new Date(account.created_at)}
          links={profile.links}
          delivery={deliveryLabels(profile.delivery)}
          action={
            <Link
              href="/profile/settings"
              className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand-pale px-6 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-rose hover:text-white sm:ml-auto sm:w-auto"
            >
              <Pencil className="size-4" aria-hidden />
              Редактирай профила
            </Link>
          }
        />

        {profile.show_stats && (
          <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-black/5 pt-5 sm:mt-6 sm:gap-4 sm:pt-6">
            {highlights.map(({ label, value, icon: Icon }) => (
              // Three across on phones too: the picture above the number there, beside it from tablets up.
              <li
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl bg-brand-rose/5 p-3 text-center sm:flex-row sm:gap-4 sm:p-4 sm:text-left"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-rose/10 text-brand-ink sm:size-12">
                  <Icon className="size-5 sm:size-5.5" aria-hidden />
                </span>
                <span className="w-full min-w-0">
                  <span className="block text-xl leading-6 font-bold text-brand-ink sm:text-2xl sm:leading-7">{value}</span>
                  <span className="block text-xs leading-4 text-brand-ink/60 sm:truncate sm:text-sm sm:leading-5">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {profile.bio && (
          <div className={profile.show_stats ? "mt-4" : "mt-6 border-t border-black/5 pt-6"}>
            <div className="rounded-2xl bg-brand-rose/5 p-4 sm:p-6">
              <h2 className="flex items-center gap-2.5 text-lg font-bold text-brand-ink">
                <FileText className="size-5 text-brand-ink/60" aria-hidden />
                За мен
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 wrap-anywhere whitespace-pre-line text-brand-ink/80 sm:text-base sm:leading-7">{profile.bio}</p>
            </div>
          </div>
        )}
      </section>

      {/* What the products the user sold made: a listing deleted as "Да, продадено" counts with its price. */}
      <section className={`${card} flex items-center gap-4 p-5 sm:p-6`}>
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Wallet className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-brand-ink/60">Изкарани от продажби</p>
          <p className="text-3xl leading-9 font-bold text-brand-ink tabular-nums">{formatAmount(listingCounts.earned)}</p>
          <p className="mt-0.5 text-xs text-brand-ink/60">
            {listingCounts.sold === 1 ? "от 1 продаден продукт" : `от ${listingCounts.sold} продадени продукта`} · броят
            се обявите, изтрити като продадени
          </p>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <li key={label} className={`${card} flex items-center gap-3 p-3`}>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-rose/10 text-brand-ink">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-lg leading-6 font-bold text-brand-ink">{value}</span>
              <span className="block truncate text-xs text-brand-ink/60">{label}</span>
            </span>
          </li>
        ))}
      </ul>

      <ContactCard profile={profile} />
    </div>
  );
}