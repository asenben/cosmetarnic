import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Avatar from "@/components/Avatar";
import Thread from "@/components/messages/Thread";
import { avatarUrl } from "@/lib/auth/avatar";
import { getCurrentUser } from "@/lib/auth/session";
import { openConversation } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Съобщения",
};

// One conversation: who it is with, what it is about, and the messages.
export default async function ConversationPage({ params }: PageProps<"/profile/messages/[id]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  // Somebody else's conversation is treated like one that does not exist.
  const opened = await openConversation(user.id, (await params).id);
  if (!opened) notFound();
  const { conversation, messages } = opened;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6">
      <Link
        href="/profile/messages"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-brand-ink/60 transition-colors hover:text-brand-rose"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Всички съобщения
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <Avatar name={conversation.other.username} src={avatarUrl(conversation.other.avatar)} className="size-11 text-lg sm:size-12" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-brand-ink sm:text-xl">{conversation.other.username}</h1>
          <p className="truncate text-sm text-brand-ink/60">
            {conversation.kind === "request" ? "Относно публикацията " : "Относно обявата "}
            {conversation.href ? (
              <Link href={conversation.href} className="font-semibold text-brand-rose hover:underline">
                {conversation.subject}
              </Link>
            ) : (
              // The post or the listing was deleted after the conversation started.
              <span className="font-semibold text-brand-ink">{conversation.subject}</span>
            )}
          </p>
        </div>
      </div>

      <Thread
        conversationId={conversation.id}
        initialMessages={messages.map(({ id, body, mine, sentAt }) => ({ id, body, mine, sentAt: sentAt.toISOString() }))}
      />
    </div>
  );
}
