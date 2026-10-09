import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import Avatar from "@/components/Avatar";
import { avatarUrl } from "@/lib/auth/avatar";
import { getCurrentUser } from "@/lib/auth/session";
import { postedAgo } from "@/lib/listings";
import { listConversations } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Съобщения",
};

// The user's conversations, the one written in last first. Each opens on its own page.
export default async function ProfileMessages() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const conversations = await listConversations(user.id);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Съобщения</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Разговорите ти с други потребители.</p>

      {conversations.length > 0 ? (
        <ul className="mt-6 divide-y divide-black/5">
          {conversations.map(({ id, subject, kind, other, lastBody, lastAt, lastMine, unread }) => (
            <li key={id}>
              <Link
                href={`/profile/messages/${id}`}
                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-zinc-50"
              >
                <Avatar name={other.username} src={avatarUrl(other.avatar)} className="size-12 text-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`truncate text-sm text-brand-ink ${unread > 0 ? "font-bold" : "font-semibold"}`}>
                      {other.username}
                    </p>
                    <span className="shrink-0 text-xs text-brand-ink/60">{postedAgo(lastAt)}</span>
                  </div>
                  <p className="truncate text-xs text-brand-ink/60">
                    {kind === "request" ? "Търся" : "Обява"}: {subject}
                  </p>
                  <p className={`mt-0.5 truncate text-sm ${unread > 0 ? "font-semibold text-brand-ink" : "text-brand-ink/70"}`}>
                    {lastMine && "Ти: "}
                    {lastBody}
                  </p>
                </div>
                {unread > 0 && (
                  <span
                    aria-label={`${unread} непрочетени`}
                    className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-rose px-1.5 text-xs font-bold text-white"
                  >
                    {unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <MessageSquare className="size-7" aria-hidden />
          </span>
          Все още нямаш съобщения.
        </div>
      )}
    </div>
  );
}
