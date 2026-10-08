"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleHelp,
  CirclePlus,
  Heart,
  House,
  LogOut,
  MessageSquare,
  Package,
  Settings,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const links = [
  { href: "/profile", label: "Моят профил", icon: House },
  { href: "/profile/listings", label: "Моите обяви", icon: Package },
  { href: "/sell", label: "Добави обява", icon: CirclePlus },
  { href: "/profile/messages", label: "Съобщения", icon: MessageSquare },
  { href: "/profile/favorites", label: "Любими", icon: Heart },
  { href: "/profile/notifications", label: "Известия", icon: Bell },
  // `divided` starts a new group, with a line above it.
  { href: "/profile/settings", label: "Настройки", icon: Settings, divided: true },
  { href: "/faq", label: "Помощ и поддръжка", icon: CircleHelp },
];

const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

export default function ProfileSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav
      aria-label="Профил"
      className="hidden w-60 shrink-0 self-start rounded-2xl border border-black/5 bg-white p-3 lg:block"
    >
      <ul className="space-y-1">
        {links.map(({ href, label, icon: Icon, divided }) => {
          const active = pathname === href;
          return (
            <li key={href} className={divided ? "mt-2! border-t border-black/5 pt-2" : undefined}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${item} ${
                  active ? "bg-brand-rose/10 text-brand-rose" : "text-brand-ink hover:bg-zinc-50 hover:text-brand-rose"
                }`}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={logout}
        className={`${item} mt-4 cursor-pointer text-brand-rose hover:bg-brand-rose/10`}
      >
        <LogOut className="size-5 shrink-0" aria-hidden />
        Изход
      </button>
    </nav>
  );
}
