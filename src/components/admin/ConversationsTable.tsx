import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import Avatar from "@/components/Avatar";
import { avatarUrl } from "@/lib/auth/avatar";
import type { AdminConversation } from "@/lib/messages";

const dateFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

// The administrator's list of conversations: who wrote to whom, about what, and the last thing
// said. Each row opens the whole conversation.
export default function ConversationsTable({ conversations }: { conversations: AdminConversation[] }) {
  if (conversations.length === 0) {
    return <p className="py-10 text-center text-sm text-brand-ink/60">Няма разговори.</p>;
  }

  return (
    <ul className="divide-y divide-black/5">
      {conversations.map(({ id, subject, kind, starter, owner, lastBody, lastAt, messages }) => (
        <li key={id}>
          <Link
            href={`/admin/messages/${id}`}
            className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-zinc-50"
          >
            {/* The two people, the one who wrote first in front. */}
            <span className="flex shrink-0 -space-x-3">
              <Avatar name={starter.username} src={avatarUrl(starter.avatar)} className="size-10 text-sm ring-2 ring-white" />
              <Avatar name={owner.username} src={avatarUrl(owner.avatar)} className="size-10 text-sm ring-2 ring-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-brand-ink">
                <span className="truncate">{starter.username}</span>
                <ArrowRight className="size-3.5 shrink-0 text-brand-ink/40" aria-label="писа на" />
                <span className="truncate">{owner.username}</span>
              </p>
              <p className="truncate text-xs text-brand-ink/60">
                {kind === "request" ? "Търся" : "Обява"}: {subject}
              </p>
              <p className="mt-0.5 truncate text-sm text-brand-ink/70">{lastBody}</p>
            </div>
            <p className="hidden shrink-0 text-right text-xs text-brand-ink/60 sm:block">
              <span className="block font-semibold text-brand-ink">
                {messages} {messages === 1 ? "съобщение" : "съобщения"}
              </span>
              {dateFormat.format(lastAt)}
            </p>
            <ChevronRight className="size-4 shrink-0 text-brand-ink/40" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
