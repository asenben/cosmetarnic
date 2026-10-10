import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Avatar from "@/components/Avatar";
import { getAdmin } from "@/lib/admin";
import { avatarUrl } from "@/lib/auth/avatar";
import { readConversation } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Разговор",
};

const timeFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

// One conversation as the administrator reads it: both people named, every message under the
// name of who sent it. Nothing can be written from here, and nothing is marked as read.
export default async function AdminConversationPage({ params }: PageProps<"/admin/messages/[id]">) {
  if (!(await getAdmin())) notFound();

  const opened = await readConversation((await params).id);
  if (!opened) notFound();
  const { conversation, messages } = opened;
  const { starter, owner } = conversation;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <Link
        href="/admin/messages"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-brand-ink/60 transition-colors hover:text-brand-rose"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Всички съобщения
      </Link>

      <h1 className="mt-4 text-xl font-bold text-brand-ink">
        {conversation.kind === "request" ? "Относно публикацията " : "Относно обявата "}
        {conversation.href ? (
          <Link href={conversation.href} className="text-brand-rose hover:underline">
            {conversation.subject}
          </Link>
        ) : (
          // The post or the listing was deleted after the conversation started.
          <span>{conversation.subject} (изтрита)</span>
        )}
      </h1>

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {[
          { label: "Писа пръв", person: starter },
          { label: conversation.kind === "request" ? "Автор на публикацията" : "Продавач", person: owner },
        ].map(({ label, person }) => (
          <div key={person.id} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
            <Avatar name={person.username} src={avatarUrl(person.avatar)} className="size-10 text-sm" />
            <div className="min-w-0">
              <dt className="text-xs text-brand-ink/60">{label}</dt>
              <dd>
                <Link href={`/admin/users/${person.id}`} className="font-semibold text-brand-rose hover:underline">
                  {person.username}
                </Link>
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <ol aria-label="Съобщения" className="mt-4 flex flex-col gap-3 rounded-xl bg-zinc-50 p-3 sm:p-4">
        {messages.map(({ id, body, senderId, sentAt, readAt }) => {
          // The one who wrote first is on the left, the other on the right, as each of them
          // would see the other.
          const fromStarter = senderId === starter.id;
          return (
            <li key={id} className={`flex max-w-[85%] min-w-0 flex-col sm:max-w-[75%] ${fromStarter ? "items-start self-start" : "items-end self-end"}`}>
              <span className="mb-1 px-1 text-xs font-semibold text-brand-ink/70">
                {fromStarter ? starter.username : owner.username}
              </span>
              <p
                className={`max-w-full rounded-2xl px-3.5 py-2 text-sm leading-5 wrap-anywhere whitespace-pre-line ${
                  fromStarter ? "rounded-bl-md border border-black/5 bg-white text-brand-ink" : "rounded-br-md bg-brand-rose text-white"
                }`}
              >
                {body}
              </p>
              <span className="mt-1 px-1 text-[0.6875rem] text-brand-ink/50">
                <time dateTime={sentAt.toISOString()}>{timeFormat.format(sentAt)}</time>
                {" · "}
                {readAt ? "прочетено" : "непрочетено"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
