import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone, User } from "lucide-react";
import Avatar from "@/components/Avatar";
import ConversationsTable from "@/components/admin/ConversationsTable";
import ListingsTable from "@/components/admin/ListingsTable";
import RequestsTable from "@/components/admin/RequestsTable";
import UserManager from "@/components/admin/UserManager";
import { getAdmin, getUser, listListings } from "@/lib/admin";
import { hasMailbox } from "@/lib/auth/accountFields";
import { avatarUrl } from "@/lib/auth/avatar";
import { listAllConversations } from "@/lib/messages";
import { getRequests } from "@/lib/requests";

const dateFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Sofia",
});

export async function generateMetadata({ params }: PageProps<"/admin/users/[id]">): Promise<Metadata> {
  // Nothing about an account is given away to somebody who is not an administrator.
  if (!(await getAdmin())) return {};
  const user = await getUser((await params).id);
  return user ? { title: user.username } : {};
}

// One account as the administrator sees it: who it is, how to reach them, and everything they
// have published, with the same rights over their listings as over anybody's.
export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await getAdmin();
  if (!admin) notFound();

  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();
  const [listings, requests, conversations] = await Promise.all([
    listListings(user.id),
    getRequests({ authorId: user.id, includeBlocked: true }),
    listAllConversations(user.id),
  ]);

  const details = [
    { icon: User, label: "Име и фамилия", value: user.fullName },
    { icon: Mail, label: "Имейл", value: hasMailbox(user.email) ? user.email : "" },
    { icon: Phone, label: "Телефон", value: user.phone },
    { icon: MapPin, label: "Град", value: user.city },
    { icon: CalendarDays, label: "Регистриран на", value: dateFormat.format(user.createdAt) },
  ].filter(({ value }) => value);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
        <Link
          href="/admin/users"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-brand-ink/60 transition-colors hover:text-brand-rose"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Всички потребители
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <Avatar name={user.username} src={avatarUrl(user.avatar)} className="size-20 text-3xl" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-brand-ink">{user.username}</h1>
            <p className="mt-1 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-brand-rose/10 px-2.5 py-1 text-brand-rose">
                {user.role === "admin" ? "Администратор" : "Потребител"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 ${
                  user.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"
                }`}
              >
                {user.verified ? "Потвърден имейл" : "Непотвърден имейл"}
              </span>
              {user.blocked && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">Блокиран</span>}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-x-8 gap-y-3 border-t border-black/5 pt-5 text-sm sm:grid-cols-2">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="size-4 shrink-0 text-brand-rose" aria-hidden />
              <dt className="shrink-0 text-brand-ink/60">{label}</dt>
              <dd className="min-w-0 truncate font-semibold text-brand-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {user.bio && (
          <p className="mt-5 rounded-2xl bg-brand-rose/5 p-4 text-sm leading-6 whitespace-pre-line text-brand-ink/80">
            {user.bio}
          </p>
        )}
      </div>

      <UserManager
        // A fresh form after every change, so it shows what is stored now.
        key={`${user.username}|${user.role}|${user.blocked}`}
        own={user.id === admin.id}
        user={{
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          phone: user.phone,
          city: user.city,
          bio: user.bio,
          role: user.role,
          blocked: user.blocked,
        }}
      />

      <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-brand-ink">Обяви ({listings.length})</h2>
        <div className="mt-2">
          <ListingsTable listings={listings} showSeller={false} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-brand-ink">Публикации в „Търся“ ({requests.length})</h2>
        <div className="mt-2">
          <RequestsTable requests={requests} showAuthor={false} />
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-brand-ink">Съобщения ({conversations.length})</h2>
        <div className="mt-2">
          <ConversationsTable conversations={conversations} />
        </div>
      </section>
    </div>
  );
}
