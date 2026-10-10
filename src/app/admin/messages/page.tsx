import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConversationsTable from "@/components/admin/ConversationsTable";
import { getAdmin } from "@/lib/admin";
import { listAllConversations } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Съобщения",
};

// Every conversation between registered users, for the administrator to read.
export default async function AdminMessages() {
  if (!(await getAdmin())) notFound();
  const conversations = await listAllConversations();

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Съобщения</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Кореспонденцията между потребителите ({conversations.length}). Отварянето на разговор тук не го отбелязва
        като прочетен за участниците.
      </p>

      <div className="mt-4">
        <ConversationsTable conversations={conversations} />
      </div>
    </div>
  );
}
