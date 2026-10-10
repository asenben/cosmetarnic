"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { adminGroups } from "@/lib/admin/sections";

const countFormat = new Intl.NumberFormat("bg-BG");

// The menu of the administration panel: its sections in titled groups, each with the number of
// things it holds where that is known.
export default function AdminSidebar({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav
      aria-label="Администрация"
      className="hidden w-72 shrink-0 self-start rounded-2xl border border-black/5 bg-white p-3 lg:block"
    >
      {/* The panel's first page, above the sections. */}
      <Link
        href="/admin"
        aria-current={pathname === "/admin" ? "page" : undefined}
        className={`mb-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          pathname === "/admin" ? "bg-brand-rose/10 text-brand-rose" : "text-brand-ink hover:bg-zinc-50 hover:text-brand-rose"
        }`}
      >
        <LayoutDashboard className="size-5 shrink-0" aria-hidden />
        Табло
      </Link>

      {adminGroups.map(({ title, sections }, index) => (
        <div key={title} className={index === 0 ? undefined : "mt-5"}>
          <h2 className="px-3 pb-1.5 text-xs font-semibold tracking-wider text-brand-ink/60 uppercase">{title}</h2>
          <ul className="space-y-0.5">
            {sections.map(({ slug, label, icon: Icon }) => {
              const href = `/admin/${slug}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              const count = counts[slug];
              return (
                <li key={slug}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-brand-rose/10 text-brand-rose" : "text-brand-ink hover:bg-zinc-50 hover:text-brand-rose"
                    }`}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {count !== undefined && (
                      <span className="shrink-0 rounded-full bg-brand-rose/10 px-2 py-0.5 text-xs font-semibold text-brand-rose tabular-nums">
                        {countFormat.format(count)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* Signs the administrator out of the site, as "Изход" does in the profile's menu. */}
      <div className="mt-4 border-t border-black/5 pt-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-rose transition-colors hover:bg-brand-rose/10"
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          Изход
        </button>
      </div>
    </nav>
  );
}
