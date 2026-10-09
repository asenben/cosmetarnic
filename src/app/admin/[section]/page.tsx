import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin";
import { adminSections } from "@/lib/admin/sections";

export async function generateMetadata({ params }: PageProps<"/admin/[section]">): Promise<Metadata> {
  const { section } = await params;
  const found = adminSections.find(({ slug }) => slug === section);
  return found ? { title: found.label } : {};
}

// One section of the administration panel. The sections are being built one by one; until a
// section has its own page, this one stands in for it.
export default async function AdminSectionPage({ params }: PageProps<"/admin/[section]">) {
  if (!(await getAdmin())) notFound();

  const { section } = await params;
  const found = adminSections.find(({ slug }) => slug === section);
  if (!found) notFound();
  const Icon = found.icon;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">{found.label}</h1>

      <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
          <Icon className="size-7" aria-hidden />
        </span>
        Този раздел предстои.
      </div>
    </div>
  );
}
