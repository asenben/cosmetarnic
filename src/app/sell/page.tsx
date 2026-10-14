import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import PaymentModal from "@/components/payments/PaymentModal";
import PaymentNotice, { type PaymentOutcome } from "@/components/payments/PaymentNotice";
import ListingForm from "@/components/sell/ListingForm";
import { contactFor, missingForListing } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { canCreateListing, getListingFee } from "@/lib/payments/canCreateListing";
import { checkoutOutcome } from "@/lib/payments/createCheckout";

export const metadata: Metadata = {
  title: "Нова обява",
};

const OUTCOMES: PaymentOutcome[] = ["success", "cancelled", "pending"];

export default async function SellPage({ searchParams }: PageProps<"/sell">) {
  // Only signed-in users can publish listings.
  const user = await getCurrentUser();
  if (!user) redirect("/");

  // Sent back by Stripe after a payment the bank confirmed on a page of its own: the payment is
  // checked and counted, and its id is taken out of the address, so that a reload does not ask
  // again. How it went is passed on for the seller to be told.
  const { payment_intent: paid, payment } = await searchParams;
  if (typeof paid === "string") redirect(`/sell?payment=${await checkoutOutcome(user, paid)}`);
  const outcome = OUTCOMES.find((known) => known === payment);
  // The phone, the town and the ways of handing over are set once on "Моят профил".
  const [contact, allowance, fee] = await Promise.all([contactFor(user.id), canCreateListing(user), getListingFee()]);

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

        {allowance.allowed && outcome && <PaymentNotice outcome={outcome} className="mt-4" />}
        <ListingForm contact={contact} missing={missingForListing(contact)} />
        {/* A seller who has used up the free listings is shown what the next one costs instead. */}
        {!allowance.allowed && (
          <PaymentModal
            // Still asked to pay, so the payment cannot have been counted, whatever the address says.
            outcome={outcome === "success" ? undefined : outcome}
            limit={allowance.limit}
            fee={{ title: fee.title, description: fee.description, price: fee.price }}
          />
        )}
      </div>
    </main>
  );
}
