import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileUp, Flag, MessageSquare, Search, Users, type LucideIcon } from "lucide-react";
import Avatar from "@/components/Avatar";
import { getAdmin, getAdminCounts, listListings, listUsers } from "@/lib/admin";
import { avatarUrl } from "@/lib/auth/avatar";
import { listReports } from "@/lib/reports";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Табло",
};

const card = "rounded-2xl border border-black/5 bg-white p-5 sm:p-6";
const dateFormat = new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "short", timeZone: "Europe/Sofia" });

// How many of the newest things each list on the page shows.
const LATEST = 5;

function SectionLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-brand-rose hover:underline">
      {children}
      <ChevronRight className="size-4" aria-hidden />
    </Link>
  );
}

// The first page of the panel: the site at a glance. How much there is of everything, the reports
// waiting to be looked at, and the newest accounts and listings, each leading to its section.
export default async function AdminDashboard() {
  const admin = await getAdmin();
  if (!admin) notFound();

  const [counts, users, listings, reports] = await Promise.all([
    getAdminCounts(),
    listUsers(),
    listListings(),
    listReports(),
  ]);
  const waiting = reports.filter(({ status }) => status === "open");

  const tiles: { href: string; label: string; value: number; icon: LucideIcon; urgent?: boolean }[] = [
    { href: "/admin/users", label: "Потребители", value: counts.users, icon: Users },
    { href: "/admin/listings", label: "Обяви", value: counts.listings, icon: FileUp },
    { href: "/admin/requests", label: "Търся", value: counts.requests, icon: Search },
    { href: "/admin/messages", label: "Разговори", value: counts.messages, icon: MessageSquare },
    { href: "/admin/reviews", label: "Сигнали", value: counts.reviews, icon: Flag, urgent: counts.reviews > 0 },
  ];

  return (
    <div className="space-y-4">
      <div className={card}>
        <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Табло</h1>
        <p className="mt-1 text-sm text-brand-ink/60">Здравей, {admin.username}. Ето какво има в сайта в момента.</p>

        {/* Each tile: what is counted and its picture on one line, the number under them. The one
            for reports is filled in while some are waiting. */}
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {tiles.map(({ href, label, value, icon: Icon, urgent }) => (
            <li key={href}>
              <Link
                href={href}
                className={`group flex h-full flex-col justify-between gap-4 rounded-2xl border p-4 transition ${
                  urgent
                    ? "border-brand-rose bg-brand-rose text-white hover:bg-brand"
                    : "border-black/5 bg-white text-brand-ink hover:border-brand-rose/40 hover:shadow-lg hover:shadow-brand-ink/5"
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className={`text-sm leading-5 font-medium ${urgent ? "text-white/90" : "text-brand-ink/60"}`}>
                    {label}
                  </span>
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      urgent ? "bg-white/20" : "bg-brand-rose/10 text-brand-rose group-hover:bg-brand-rose group-hover:text-white"
                    }`}
                  >
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span className="text-3xl leading-8 font-bold tabular-nums">{value}</span>
                  <ChevronRight
                    className={`size-4 transition-transform group-hover:translate-x-0.5 ${urgent ? "text-white/80" : "text-brand-ink/30"}`}
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {waiting.length > 0 && (
        <section className={card}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-ink">Сигнали, които чакат преглед</h2>
            <SectionLink href="/admin/reviews">Всички сигнали</SectionLink>
          </div>
          <ul className="mt-2 divide-y divide-black/5">
            {waiting.slice(0, LATEST).map((report) => (
              <li key={report.id} className="py-3 text-sm">
                <p className="font-semibold text-brand-ink">{report.reason}</p>
                <p className="mt-0.5 text-xs text-brand-ink/60">
                  Обява: {report.listing.title}
                  {report.seller && ` · продавач ${report.seller.username}`} · {dateFormat.format(report.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={card}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-ink">Нови потребители</h2>
            <SectionLink href="/admin/users">Всички</SectionLink>
          </div>
          <ul className="mt-2 divide-y divide-black/5">
            {users.slice(0, LATEST).map((user) => (
              <li key={user.id}>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-zinc-50"
                >
                  <Avatar name={user.username} src={avatarUrl(user.avatar)} className="size-9 text-sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-ink">{user.username}</span>
                  <span className="shrink-0 text-xs text-brand-ink/60">{dateFormat.format(user.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-ink">Нови обяви</h2>
            <SectionLink href="/admin/listings">Всички</SectionLink>
          </div>
          {listings.length > 0 ? (
            <ul className="mt-2 divide-y divide-black/5">
              {listings.slice(0, LATEST).map((listing) => (
                <li key={listing.id}>
                  <Link
                    href={`/product/${listing.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-zinc-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-brand-ink">{listing.title}</span>
                      <span className="block truncate text-xs text-brand-ink/60">
                        {listing.seller.username} · {dateFormat.format(listing.createdAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-brand-ink">{formatPrice(listing.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-brand-ink/60">Още няма обяви.</p>
          )}
        </section>
      </div>
    </div>
  );
}
