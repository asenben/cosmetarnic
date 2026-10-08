"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import { Bell, Heart, User } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFavoriteCount } from "@/components/FavoritesProvider";
import SearchBox from "@/components/SearchBox";
import UserMenu from "@/components/UserMenu";

const links = [
  { href: "/search", label: "Търся" },
  { href: "/", label: "Продавалник" },
];

const iconButton =
  "flex size-10 shrink-0 items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-brand/10 hover:text-brand";

export default function Navigation() {
  const pathname = usePathname();
  const { isLoggedIn, openLogin, requireAuth } = useAuth();
  const favoriteCount = useFavoriteCount();
  // Links to account-only pages open the login form instead of navigating when signed out.
  const guardLink = (event: MouseEvent) => {
    if (!requireAuth()) event.preventDefault();
  };
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    const place = () => {
      const active = list.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || active.offsetWidth === 0) {
        indicator.style.opacity = "0";
        return;
      }
      // Appear in place instead of sliding in from wherever it was while hidden.
      const wasHidden = indicator.style.opacity !== "1";
      if (wasHidden) indicator.style.transition = "none";
      indicator.style.translate = `${active.offsetLeft}px 0`;
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.opacity = "1";
      if (wasHidden) {
        void indicator.offsetWidth;
        indicator.style.transition = "";
      }
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header className="bg-zinc-50 pt-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          aria-label="Основна навигация"
          className="flex h-18 items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 sm:gap-6 sm:px-5"
        >
          <Link href="/" aria-label="Начало" className="shrink-0">
            <Image
              src="/images/logo.svg"
              alt="Cosmetarnic"
              width={48}
              height={48}
              priority
              className="size-12 rounded-full object-cover"
            />
          </Link>

          <div className="hidden flex-auto justify-center md:flex">
            <ul ref={listRef} className="relative flex gap-6">
              {links.map(({ href, label }) => {
                const active =
                  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href} className="flex">
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center py-1.5 text-sm font-semibold transition-colors hover:text-brand-rose ${
                        active ? "text-brand-rose" : "text-brand-ink"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
              <li
                ref={indicatorRef}
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-brand-rose opacity-0 transition-[translate,width,opacity] duration-300 ease-out motion-reduce:transition-none"
              />
            </ul>
          </div>

          <SearchBox />

          <div className="flex items-center gap-1 md:grow md:justify-center">
            <Link
              href="/profile/favorites"
              aria-label={favoriteCount > 0 ? `Любими (${favoriteCount})` : "Любими"}
              onClick={guardLink}
              className={`${iconButton} relative hidden sm:flex`}
            >
              <Heart className="size-5.5" aria-hidden />
              {/* How many listings carry the user's heart. */}
              {favoriteCount > 0 && (
                <span
                  aria-hidden
                  className="absolute top-0 right-0 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-rose px-1 text-[0.6875rem] leading-none font-bold text-white ring-2 ring-white"
                >
                  {favoriteCount > 99 ? "99+" : favoriteCount}
                </span>
              )}
            </Link>
            <Link
              href="/profile/notifications"
              aria-label="Известия"
              onClick={guardLink}
              className={`${iconButton} hidden sm:flex`}
            >
              <Bell className="size-5.5" aria-hidden />
            </Link>
            <span className="mx-2 hidden h-6 w-px bg-brand-ink/15 sm:block" aria-hidden />
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <button
                type="button"
                aria-label="Вход"
                aria-haspopup="dialog"
                onClick={openLogin}
                className={`${iconButton} cursor-pointer`}
              >
                <User className="size-5.5" aria-hidden />
              </button>
            )}
          </div>

          <Link
            href="/sell"
            onClick={guardLink}
            className="shrink-0 rounded-xl bg-brand-rose px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand sm:px-6"
          >
            Добави обява
          </Link>
        </nav>
      </div>
    </header>
  );
}