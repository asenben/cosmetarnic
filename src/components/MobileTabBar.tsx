"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { Heart, House, Plus, Search, User, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFavoriteCount } from "@/components/FavoritesProvider";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  // Tells whether the tab's own page, or one inside it, is the one open.
  active: (pathname: string) => boolean;
  // Opens the login form instead when nobody is signed in.
  signedInOnly?: boolean;
};

const isFavorites = (pathname: string) => pathname.startsWith("/profile/favorites");

// The tabs at the sides of the round "Добави" button, two on each.
const before: Tab[] = [
  { href: "/", label: "Начало", icon: House, active: (pathname) => pathname === "/" || pathname.startsWith("/product") },
  { href: "/search", label: "Търся", icon: Search, active: (pathname) => pathname.startsWith("/search") },
];
const after: Tab[] = [
  { href: "/profile/favorites", label: "Любими", icon: Heart, active: isFavorites, signedInOnly: true },
  {
    href: "/profile",
    label: "Профил",
    icon: User,
    active: (pathname) => pathname.startsWith("/profile") && !isFavorites(pathname),
    signedInOnly: true,
  },
];

const tab = "flex h-full flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors";

// The bar along the bottom of the screen on phones: it stays there while the page scrolls, and
// takes the place of the links and the buttons the top bar has on wider screens.
export default function MobileTabBar() {
  const pathname = usePathname();
  const { requireAuth } = useAuth();
  const favoriteCount = useFavoriteCount();

  const guard = (event: MouseEvent) => {
    if (!requireAuth()) event.preventDefault();
  };

  const link = ({ href, label, icon: Icon, active, signedInOnly }: Tab) => {
    const current = active(pathname);
    const count = href === "/profile/favorites" ? favoriteCount : 0;
    return (
      <Link
        key={href}
        href={href}
        aria-current={current ? "page" : undefined}
        onClick={signedInOnly ? guard : undefined}
        className={`${tab} ${current ? "text-brand-rose" : "text-brand-ink/70"}`}
      >
        <span className="relative">
          <Icon className="size-5.5" aria-hidden />
          {count > 0 && (
            <span
              aria-hidden
              className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-rose px-1 text-[0.625rem] leading-none font-bold text-white ring-2 ring-white"
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Keeps the end of the page from hiding behind the bar. */}
      <div aria-hidden className="h-16 md:hidden" />

      <nav
        aria-label="Навигация за телефон"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-black/5 bg-white px-1 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {before.map(link)}

        {/* The round button stands out of the bar, in the middle. */}
        <Link
          href="/sell"
          onClick={guard}
          aria-current={pathname.startsWith("/sell") ? "page" : undefined}
          className="flex flex-1 flex-col items-center justify-end gap-1 pb-2 text-[0.6875rem] font-medium text-brand-ink/70"
        >
          <span className="-mt-4 flex size-12 items-center justify-center rounded-full bg-brand-rose text-white shadow-lg shadow-brand-rose/30 ring-4 ring-white">
            <Plus className="size-6" aria-hidden />
          </span>
          Добави
        </Link>

        {after.map(link)}
      </nav>
    </>
  );
}
