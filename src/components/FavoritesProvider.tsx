"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type FavoritesContextValue = {
  ids: ReadonlySet<string>;
  toggle: (listingId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

type FavoritesProviderProps = {
  // The favourites of whoever was signed in when the page was rendered on the server.
  initialIds: string[];
  children: ReactNode;
};

// Keeps the signed-in user's favourite listings for every heart on the page, so marking a
// listing in one place shows in all the others: the cards, the listing's own page, the number
// by the heart in the navigation and the "Любими" page.
export default function FavoritesProvider({ initialIds, children }: FavoritesProviderProps) {
  const { user, requireAuth } = useAuth();
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set(initialIds));

  // Signing in or out without leaving the page changes whose favourites these are.
  const userId = user?.id ?? null;
  const loadedFor = useRef(userId);
  useEffect(() => {
    if (loadedFor.current === userId) return;
    loadedFor.current = userId;
    let stale = false;
    fetch("/api/favorites")
      .then((response) => (response.ok ? response.json() : { ids: [] }))
      .catch(() => ({ ids: [] }))
      .then(({ ids }: { ids: string[] }) => {
        if (!stale) setIds(new Set(ids));
      });
    return () => {
      stale = true;
    };
  }, [userId]);

  const set = (listingId: string, favorite: boolean) =>
    setIds((current) => {
      const next = new Set(current);
      if (favorite) next.add(listingId);
      else next.delete(listingId);
      return next;
    });

  const toggle = (listingId: string) => {
    // Signed-out visitors get the login form instead.
    if (!requireAuth()) return;
    const favorite = !ids.has(listingId);
    // The heart changes at once and goes back if the server did not accept the change.
    set(listingId, favorite);
    fetch(`/api/favorites/${listingId}`, { method: favorite ? "PUT" : "DELETE" })
      .then((response) => {
        if (!response.ok) set(listingId, !favorite);
      })
      .catch(() => set(listingId, !favorite));
  };

  return <FavoritesContext value={{ ids, toggle }}>{children}</FavoritesContext>;
}

function useFavorites() {
  const context = use(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return context;
}

// Whether the listing is among the user's favourites, and the action for its heart button.
export function useFavorite(listingId: string) {
  const { ids, toggle } = useFavorites();
  return { favorite: ids.has(listingId), toggleFavorite: () => toggle(listingId) };
}

// How many favourites the user has, for the heart in the navigation.
export function useFavoriteCount() {
  return useFavorites().ids.size;
}

// For lists of favourites: tells which of the listings are still marked.
export function useFavoriteIds() {
  return useFavorites().ids;
}
