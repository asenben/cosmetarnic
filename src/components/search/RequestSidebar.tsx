"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Heart, LayoutGrid, MapPin, Phone, Sparkles, Tag } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import MessageButton from "@/components/messages/MessageButton";

// A "Търся" post as its own page shows it beside the picture.
export type RequestDetails = {
  id: string;
  title: string;
  brand: string;
  categoryLabel: string;
  condition: "new" | "used" | "any";
  // The most the person would pay, in euro; null when they did not say.
  budget: number | null;
  city: string;
  postedAgo: string;
  author: { username: string; avatar: string | null; memberSince: string };
  // Whether the post is the signed-in user's own, and whether they marked it with the heart.
  own: boolean;
  favorite: boolean;
};

const conditionLabels = { new: "Ново", used: "Използвано", any: "Ново или използвано" };

const priceFormat = new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" });

const phoneButton =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-rose text-sm font-semibold text-brand-rose transition-colors hover:bg-brand-rose/10 disabled:cursor-default disabled:opacity-60";

// The card beside the picture on a post's page, built like the one on a listing's page: what is
// wanted and for how much, the details, the way to get in touch, and who is looking.
export default function RequestSidebar({ request }: { request: RequestDetails }) {
  const { requireAuth } = useAuth();
  const [favorite, setFavorite] = useState(request.favorite);
  const [phone, setPhone] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const specs = [
    { icon: LayoutGrid, label: "Категория", value: request.categoryLabel },
    { icon: Tag, label: "Марка", value: request.brand },
    { icon: Sparkles, label: "Състояние", value: conditionLabels[request.condition] },
    { icon: CalendarDays, label: "Публикувана", value: request.postedAgo },
    // The brand is optional in the form.
  ].filter(({ value }) => value);

  const toggleFavorite = async () => {
    // Signed-out visitors get the login form instead.
    if (!requireAuth()) return;
    const next = !favorite;
    // The heart changes at once and goes back if the server did not accept the change.
    setFavorite(next);
    try {
      const response = await fetch(`/api/requests/${request.id}/favorite`, { method: next ? "PUT" : "DELETE" });
      if (!response.ok) setFavorite(!next);
    } catch {
      setFavorite(!next);
    }
  };

  // The number is asked from the server only now, and only for somebody signed in.
  const showPhone = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/requests/${request.id}`);
      const result = await response.json();
      if (response.ok) setPhone(result.phone);
      else setError(result.message);
    } catch {
      setError("Не успяхме да покажем номера. Опитай отново.");
    }
    setBusy(false);
  };

  return (
    <aside className="order-2 min-w-0 space-y-5 lg:order-none">
      <section className="rounded-2xl border border-black/5 bg-white">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg leading-snug font-bold wrap-break-word text-brand-ink">{request.title}</h1>
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
            Търси се{request.brand && " · "}
            {request.brand && <span className="font-medium text-brand-rose">{request.brand}</span>}
          </p>
          <p className="mt-4 text-2xl font-bold text-brand-ink">
            {request.budget === null ? "По договаряне" : priceFormat.format(request.budget)}
          </p>
        </div>

        <dl className="border-t border-black/5 px-5">
          {specs.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-black/5 py-3 text-sm last:border-b-0"
            >
              <dt className="flex items-center gap-2.5 text-brand-ink/60">
                <Icon className="size-4 text-brand-rose" aria-hidden />
                {label}
              </dt>
              <dd className="text-right font-semibold text-brand-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-black/5 p-5">
          {request.own ? (
            // Nobody rings themselves up; the author is sent to where their posts are managed.
            <Link
              href="/profile/search"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-black/10 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-rose/50"
            >
              Това е твоя публикация – управлявай я от профила
            </Link>
          ) : (
            <>
              <MessageButton target={{ requestId: request.id }} className="mb-3" />
              {phone ? (
                <a href={`tel:${phone.replaceAll(" ", "")}`} className={phoneButton}>
                  <Phone className="size-4.5" aria-hidden />
                  {phone}
                </a>
              ) : (
                <button type="button" disabled={busy} onClick={showPhone} className={phoneButton}>
                  <Phone className="size-4.5" aria-hidden />
                  Покажи номер
                </button>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="mt-3 flex h-14 items-center gap-2.5 rounded-xl bg-zinc-100 px-4 text-sm font-medium text-brand-ink">
            <MapPin className="size-5 shrink-0" aria-hidden />
            {request.city}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="text-base font-bold text-brand-ink">Търси</h2>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={request.author.username} src={request.author.avatar} className="size-14 text-xl" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-ink">{request.author.username}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-ink/60">
              <CalendarDays className="size-4" aria-hidden />
              Член от {request.author.memberSince}
            </p>
          </div>
        </div>
      </section>
    </aside>
  );
}
