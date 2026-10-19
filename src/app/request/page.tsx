import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import RequestForm from "@/components/search/RequestForm";
import { contactFor } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Добави публикация за търсене",
};

// The form for a new "Търся" post, laid out like the page for a new listing (/sell).
export default async function NewRequestPage() {
  // Only signed-in users can write a "Търся" post.
  const user = await getCurrentUser();
  if (!user) redirect("/search");
  // The phone and the town are set once on "Моят профил", each shown only if the user chose so.
  const { phone, city } = await contactFor(user.id);

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        {/* Says plainly that this is a "Търся" post, not a listing for sale. */}
        <header className="flex items-start gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-rose/10 text-brand-rose">
            <Search className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-brand-ink sm:text-2xl">Добави публикация за търсене</h1>
            <p className="mt-1 text-sm text-brand-ink/60">
              Опиши артикула, който търсиш, и продавачи, които го имат, ще могат да ти предложат оферта.
            </p>
          </div>
        </header>

        <RequestForm contact={{ phone, city }} />
      </div>
    </main>
  );
}
