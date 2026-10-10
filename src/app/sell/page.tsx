import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import ListingForm from "@/components/sell/ListingForm";
import { getProfile } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Нова обява",
};

export default async function SellPage() {
  // Only signed-in users can publish listings.
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const profile = await getProfile(user.id);

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        <nav aria-label="Навигационна пътека">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-brand-ink/60">
            <li>
              <Link href="/" className="transition-colors hover:text-brand-rose">
                Начало
              </Link>
            </li>
            <li className="flex items-center gap-1.5 font-medium text-brand-ink" aria-current="page">
              <ChevronRight className="size-4" aria-hidden />
              Нова обява
            </li>
          </ol>
        </nav>

        <ListingForm phone={profile?.phone} />
      </div>
    </main>
  );
}
