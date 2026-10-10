import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RequestsTable from "@/components/admin/RequestsTable";
import { getAdmin } from "@/lib/admin";
import { getRequests } from "@/lib/requests";

export const metadata: Metadata = {
  title: "Търся",
};

// Every "Търся" post on the site, for the administrator to open, edit or delete.
export default async function AdminRequests() {
  if (!(await getAdmin())) notFound();
  const requests = await getRequests({ includeBlocked: true });

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Търся</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Всички публикации на всички потребители ({requests.length}). Можеш да отвориш, редактираш или изтриеш всяка.
      </p>

      <div className="mt-4">
        <RequestsTable requests={requests} />
      </div>
    </div>
  );
}
