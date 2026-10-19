"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Plus, Search, Tag, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const options: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/sell", label: "Добави публикация", icon: Tag },
  { href: "/request", label: "Добави търсене", icon: Search },
];

// The round pink button with a plus in the navigation, with a menu that opens under it: a listing
// to sell, or a "Търся" post. Signed-out visitors get the login form instead.
export default function AddMenu({ className = "" }: { className?: string }) {
  const id = useId();
  const { requireAuth } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`relative shrink-0 ${className}`}
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
        aria-label="Добави"
        title="Добави"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (open) setOpen(false);
          else if (requireAuth()) setOpen(true);
        }}
        className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-brand-rose text-white transition-colors hover:bg-brand"
      >
        <Plus
          className={`size-5.5 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-45" : ""}`}
          aria-hidden
        />
      </button>

      <ul
        id={id}
        role="menu"
        aria-label="Добави"
        className={`absolute top-full right-0 z-50 mt-3 w-56 origin-top-right rounded-2xl border border-black/5 bg-white p-2 shadow-lg shadow-brand-ink/10 transition duration-150 ease-out motion-reduce:transition-none ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {options.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-ink transition-colors hover:bg-zinc-50 hover:text-brand-rose"
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
