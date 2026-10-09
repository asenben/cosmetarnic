import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdmin, getAdminCounts } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Администрация",
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Only administrators get in. Everybody else is told the page does not exist, so the panel's
  // address gives nothing away.
  if (!(await getAdmin())) notFound();

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto flex w-full max-w-7xl gap-5 px-4 py-6 sm:px-6">
        <AdminSidebar counts={await getAdminCounts()} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
