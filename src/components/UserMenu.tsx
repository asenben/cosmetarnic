"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  FileText,
  Heart,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import { hasMailbox } from "@/lib/auth/accountFields";

type MenuLink = { href: string; label: string; icon: LucideIcon };

// Each inner list is a group; the groups are separated by a line.
const groups: MenuLink[][] = [
  [
    { href: "/profile", label: "Моят профил", icon: User },
    { href: "/profile/listings", label: "Моите обяви", icon: FileText },
    { href: "/sell", label: "Добави обява", icon: Plus },
    { href: "/profile/search", label: "Търся", icon: Search },
    { href: "/profile/messages", label: "Съобщения", icon: MessageSquare },
    { href: "/profile/favorites", label: "Любими", icon: Heart },
    { href: "/profile/notifications", label: "Известия", icon: Bell },
  ],
  [
    { href: "/profile/settings", label: "Настройки", icon: Settings },
    { href: "/faq", label: "Помощ и поддръжка", icon: CircleHelp },
  ],
];

const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

// The signed-in user's avatar in the navigation, with the account menu that opens under it.
export default function UserMenu() {
  const id = useId();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div
      className="relative"
      // Closes when focus leaves the menu: a click elsewhere, or tabbing past the last item.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label="Профил"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full py-0.5 pr-1.5 pl-0.5 text-brand-ink transition-colors hover:bg-brand/10"
      >
        <Avatar name={user.username} src={user.avatar} className="size-9 text-sm" />
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div
        id={id}
        role="menu"
        aria-label="Профил"
        className={`absolute top-full right-0 z-50 mt-3 w-64 origin-top-right rounded-2xl border border-black/5 bg-white p-2 shadow-lg shadow-brand-ink/10 transition duration-150 ease-out motion-reduce:transition-none ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name={user.username} src={user.avatar} className="size-10 text-base" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-ink">{user.username}</p>
            <p className="truncate text-xs text-brand-ink/60">
              {hasMailbox(user.email) ? user.email : user.role === "admin" ? "Администратор" : ""}
            </p>
          </div>
        </div>

        {/* Administrators get the way into the panel above everything else. */}
        {user.role === "admin" && (
          <Link
            href="/admin"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={`${item} mt-1 ${
              pathname.startsWith("/admin")
                ? "bg-brand-rose/10 text-brand-rose"
                : "text-brand-ink hover:bg-zinc-50 hover:text-brand-rose"
            }`}
          >
            <ShieldCheck className="size-5 shrink-0" aria-hidden />
            Администрация
          </Link>
        )}

        {groups.map((links, index) => (
          <ul key={index} className={index === 0 ? "mt-1" : "mt-2 border-t border-black/5 pt-2"}>
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`${item} ${
                      active ? "bg-brand-rose/10 text-brand-rose" : "text-brand-ink hover:bg-zinc-50 hover:text-brand-rose"
                    }`}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}

        <div className="mt-2 border-t border-black/5 pt-2">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className={`${item} cursor-pointer text-brand-rose hover:bg-brand-rose/10`}
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            Изход
          </button>
        </div>
      </div>
    </div>
  );
}
