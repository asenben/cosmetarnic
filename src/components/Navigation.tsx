"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Heart, MessageSquare, Plus, User } from "lucide-react";
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

// The number in the corner of a button, as on "Любими"; `ring` matches the background around it.
function CountBadge({ count, ring }: { count: number; ring: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={`absolute top-0 right-0 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-rose px-1 text-[0.6875rem] leading-none font-bold text-white ring-2 ${ring}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// How often the number of unread messages is asked for again while the page is being looked at,
// so a new message shows within moments without reloading.
const UNREAD_REFRESH_MS = 5_000;

// `unreadMessages` is the count when the page was loaded; it is kept up to date from there.
export default function Navigation({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  const { isLoggedIn, openLogin, requireAuth } = useAuth();
  const favoriteCount = useFavoriteCount();
  const [unreadCount, setUnreadCount] = useState(unreadMessages);
  // Nobody signed in has messages, whatever was counted before signing out.
  const unread = isLoggedIn ? unreadCount : 0;
  const messagesLabel = unread > 0 ? `Съобщения (${unread} непрочетени)` : "Съобщения";

  // Asked again on every page opened, e.g. after reading a conversation, every few seconds while
  // the tab is in view, and at once when the visitor comes back to it. A hidden tab asks nothing.
  useEffect(() => {
    if (!isLoggedIn) return;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/conversations/unread", { cache: "no-store" });
        if (response.ok) setUnreadCount((await response.json()).count);
      } catch {
        // The number stays as it was until the next try.
      }
    };
    refresh();
    const timer = setInterval(refresh, UNREAD_REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [isLoggedIn, pathname]);
  const onItemPage = pathname.startsWith("/product/") || /^\/search\/[^/]+$/.test(pathname);
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
      {/* Phones: the logo with the account's buttons across from it, and the search field under them. */}
      <div className="px-4 md:hidden">
        {/* The logo, and across from it the messages, the favourites and the account. */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Начало" className="shrink-0">
            <Image src="/images/logo.svg" alt="Cosmetarnic" width={44} height={44} priority className="size-11 rounded-full object-cover" />
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/profile/messages"
              aria-label={messagesLabel}
              onClick={guardLink}
              className={`${iconButton} relative`}
            >
              <MessageSquare className="size-5.5" aria-hidden />
              <CountBadge count={unread} ring="ring-zinc-50" />
            </Link>
            <Link
              href="/profile/favorites"
              aria-label={favoriteCount > 0 ? `Любими (${favoriteCount})` : "Любими"}
              onClick={guardLink}
              className={`${iconButton} relative`}
            >
              <Heart className="size-5.5" aria-hidden />
              {favoriteCount > 0 && (
                <span
                  aria-hidden
                  className="absolute top-0 right-0 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-rose px-1 text-[0.6875rem] leading-none font-bold text-white ring-2 ring-zinc-50"
                >
                  {favoriteCount > 99 ? "99+" : favoriteCount}
                </span>
              )}
            </Link>
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
            {/* "Добави обява" as a round button with a plus, in the colour of the wide screens' button. */}
            <Link
              href="/sell"
              aria-label="Добави обява"
              onClick={guardLink}
              className="ml-1.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-rose text-white transition-colors hover:bg-brand"
            >
              <Plus className="size-5.5" aria-hidden />
            </Link>
          </div>
        </div>
        {/* Not on the page of one listing or one "Търся" post: there the photo comes first. */}
        {!onItemPage && <SearchBox className="mt-3 block" wide />}
      </div>

      <div className="mx-auto hidden max-w-7xl px-4 sm:px-6 md:block">
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

          {/* The same buttons as on phones: the messages, then the favourites. */}
          <div className="flex items-center gap-1 md:grow md:justify-center">
            <Link
              href="/profile/messages"
              aria-label={messagesLabel}
              onClick={guardLink}
              className={`${iconButton} relative hidden sm:flex`}
            >
              <MessageSquare className="size-5.5" aria-hidden />
              {/* How many messages wait unread. */}
              <CountBadge count={unread} ring="ring-white" />
            </Link>
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

          {/* "Добави обява" as a round button with a plus, as on phones. */}
          <Link
            href="/sell"
            aria-label="Добави обява"
            title="Добави обява"
            onClick={guardLink}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-rose text-white transition-colors hover:bg-brand"
          >
            <Plus className="size-5.5" aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  );
}