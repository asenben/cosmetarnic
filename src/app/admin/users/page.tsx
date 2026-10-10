import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Avatar from "@/components/Avatar";
import { getAdmin, listUsers } from "@/lib/admin";
import { hasMailbox } from "@/lib/auth/accountFields";
import { avatarUrl } from "@/lib/auth/avatar";

export const metadata: Metadata = {
  title: "Потребители",
};

const dateFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Sofia",
});

// Every account on the site. Each row opens the account's page in the panel.
export default async function AdminUsers() {
  if (!(await getAdmin())) notFound();
  const users = await listUsers();

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Потребители</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Всички регистрирани профили ({users.length}).</p>

      <ul className="mt-4 divide-y divide-black/5">
        {users.map((user) => (
          <li key={user.id}>
            <Link
              href={`/admin/users/${user.id}`}
              className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-zinc-50"
            >
              <Avatar name={user.username} src={avatarUrl(user.avatar)} className="size-11 text-base" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold text-brand-ink">
                  <span className="truncate">{user.username}</span>
                  {user.role === "admin" && (
                    <span className="shrink-0 rounded-full bg-brand-rose/10 px-2 py-0.5 text-xs font-semibold text-brand-rose">
                      Администратор
                    </span>
                  )}
                  {user.blocked && (
                    <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                      Блокиран
                    </span>
                  )}
                  {!user.verified && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Непотвърден имейл
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-brand-ink/60">
                  {[user.fullName, hasMailbox(user.email) ? user.email : "", user.phone, user.city]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <p className="hidden shrink-0 text-right text-xs text-brand-ink/60 sm:block">
                <span className="block font-semibold text-brand-ink">
                  {user.listings} обяви · {user.requests} в „Търся“
                </span>
                от {dateFormat.format(user.createdAt)}
              </p>
              <ChevronRight className="size-4 shrink-0 text-brand-ink/40" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
