import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingsTable from "@/components/admin/ListingsTable";
import { getAdmin, listListings } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Обяви",
};

// Every listing on the site, for the administrator to open, edit or delete.
export default async function AdminListings() {
  if (!(await getAdmin())) notFound();
  const listings = await listListings();

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Обяви</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Всички обяви на всички продавачи ({listings.length}). Можеш да отвориш, редактираш или изтриеш всяка.
      </p>

      <div className="mt-4">
        <ListingsTable listings={listings} />
      </div>
    </div>
  );
}
