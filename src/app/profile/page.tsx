import type { Metadata } from "next";
import { CalendarDays, CircleCheck, FileText, Heart, MapPin, Package, Pencil, ShoppingBag, Tag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import LinkMark from "@/components/profile/LinkMark";
import { getProfile } from "@/lib/auth/profile";
import { profileLinks } from "@/lib/auth/profileLinks";
import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import { countUserListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Моят профил",
};

const card = "rounded-2xl border border-black/5 bg-white";

const fullDate = new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "long", year: "numeric" });

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [[account], profile, activeListings] = await Promise.all([
    sql`select created_at, email_verified_at from users where id = ${user.id}`,
    getProfile(user.id),
    countUserListings(user.id),
  ]);
  const memberSince = fullDate.format(new Date(account.created_at));
  // "Verified" means the owner confirmed the email address the account was registered with.
  const verified = account.email_verified_at !== null;
  // Only the links that were filled in and left switched to "public" in the settings.
  const shownLinks = profileLinks.filter(({ key }) => profile.links[key].url && profile.links[key].public);

  // Sales, favourites and purchases are not stored yet, so every account starts with none of them.
  // The three counts shown inside the profile card; the visitor can hide them in the settings.
  const highlights = [
    { label: "Активни обяви", value: activeListings, icon: FileText },
    { label: "Продадени", value: 0, icon: ShoppingBag },
    { label: "Любими", value: 0, icon: Heart },
  ];
  // The full row under the card.
  const stats = [
    { label: "Активни обяви", value: activeListings, icon: Package },
    { label: "Продадени", value: 0, icon: Tag },
    { label: "Архивирани", value: 0, icon: FileText },
    { label: "Любими", value: 0, icon: Heart },
    { label: "Покупки", value: 0, icon: ShoppingBag },
  ];

  return (
    <div className="space-y-4">
      <section className={`${card} p-6 shadow-sm shadow-brand-ink/5 sm:p-8`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <Avatar name={user.username} src={user.avatar} className="size-36 text-5xl ring-4 ring-brand-pale/50" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="min-w-0 truncate text-3xl font-bold text-brand-ink">{user.username}</h1>
              {verified && (
                <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600">
                  <CircleCheck className="size-5 fill-emerald-600 text-emerald-50" aria-hidden />
                  Проверен профил
                </span>
              )}
              <Link
                href="/profile/settings"
                className="ml-auto flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-pale px-6 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-rose hover:text-white"
              >
                <Pencil className="size-4" aria-hidden />
                Редактирай профила
              </Link>
            </div>

            <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-brand-ink/60">
              {profile.city && (
                <>
                  <li className="flex items-center gap-2">
                    <MapPin className="size-5 shrink-0" aria-hidden />
                    {profile.city}
                  </li>
                  <li aria-hidden className="text-brand-ink/30">
                    |
                  </li>
                </>
              )}
              <li className="flex items-center gap-2">
                <CalendarDays className="size-5 shrink-0" aria-hidden />
                Член от {memberSince}
              </li>
            </ul>
          </div>
        </div>

        {profile.show_stats && (
          <ul className="mt-6 grid gap-4 border-t border-black/5 pt-6 sm:grid-cols-3">
            {highlights.map(({ label, value, icon: Icon }) => (
              <li key={label} className="flex items-center gap-4 rounded-2xl bg-brand-rose/5 p-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-rose/10 text-brand-ink">
                  <Icon className="size-5.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xl leading-7 font-bold text-brand-ink">{value}</span>
                  <span className="block truncate text-sm text-brand-ink/60">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* The description and the public links share one tinted box under the counts. */}
        {(profile.bio || shownLinks.length > 0) && (
          <div className={profile.show_stats ? "mt-4" : "mt-6 border-t border-black/5 pt-6"}>
            <div className="rounded-2xl bg-brand-rose/5 p-5 sm:p-6">
              {profile.bio && (
                <>
                  <h2 className="flex items-center gap-2.5 text-lg font-bold text-brand-ink">
                    <FileText className="size-5 text-brand-ink/60" aria-hidden />
                    За мен
                  </h2>
                  <p className="mt-3 max-w-4xl leading-7 whitespace-pre-line text-brand-ink/80">{profile.bio}</p>
                </>
              )}

              {shownLinks.length > 0 && (
                <ul className={`flex flex-wrap gap-4 ${profile.bio ? "mt-5 border-t border-black/5 pt-5" : ""}`}>
                  {shownLinks.map(({ key, label }) => (
                    <li key={key}>
                      <a
                        href={profile.links[key].url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        aria-label={label}
                        title={label}
                        className="block rounded-full transition-opacity hover:opacity-80"
                      >
                        <LinkMark site={key} size="lg" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
    </div>
  );
}