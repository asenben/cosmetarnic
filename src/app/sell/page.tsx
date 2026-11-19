import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import PaymentModal from "@/components/payments/PaymentModal";
import ListingForm from "@/components/sell/ListingForm";
import { contactFor, missingForListing } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { bankTransfer, canCreateListing, getListingFee, transferReference } from "@/lib/payments/canCreateListing";

export const metadata: Metadata = {
  title: "Добави публикация за продажба",
};

export default async function SellPage() {
  // Only signed-in users can publish listings.
  const user = await getCurrentUser();
  if (!user) redirect("/");

  // The phone, the town and the ways of handing over are set once on "Моят профил".
  const [contact, allowance, fee] = await Promise.all([contactFor(user.id), canCreateListing(user), getListingFee()]);

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        {/* Says plainly that this is a listing for sale, as the "Търся" form says it is a post for searching. */}
        <header className="flex items-start gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-rose/10 text-brand-rose">
            <Tag className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-brand-ink sm:text-2xl">Добави публикация за продажба</h1>
            <p className="mt-1 text-sm text-brand-ink/60">
              Опиши артикула, който продаваш, и купувачи, които го търсят, ще могат да ти пишат.
            </p>
          </div>
        </header>

        <ListingForm contact={contact} missing={missingForListing(contact)} />
        {/* A seller who has used up the free listings is shown what the next one costs and where
            to transfer the money instead. */}
        {!allowance.allowed && (
          <PaymentModal limit={allowance.limit} fee={bankTransfer(fee)} reference={transferReference(user.username)} />
        )}
      </div>
    </main>
  );
}
