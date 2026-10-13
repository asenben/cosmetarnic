import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Wallet } from "lucide-react";
import CardPaymentForm from "@/components/payments/CardPaymentForm";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { canCreateListing, getListingFee } from "@/lib/payments/canCreateListing";
import { createCheckout } from "@/lib/payments/createCheckout";

export const metadata: Metadata = {
  title: "Плащане на обява",
};

const GENERIC_ERROR = "Плащането не можа да започне. Опитай отново след малко.";

// Where a seller who has used up the free listings pays for the next one by card.
export default async function PayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  // Nothing is sold to a seller who can publish without paying.
  const [allowance, fee] = await Promise.all([canCreateListing(user), getListingFee()]);
  if (allowance.allowed) redirect("/sell");

  const checkout = await createCheckout(user).catch((error) => {
    console.error("Payment could not be started", error);
    return { ok: false as const, message: GENERIC_ERROR };
  });

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
            <li className="flex items-center gap-1.5">
              <ChevronRight className="size-4" aria-hidden />
              Нова обява
            </li>
            <li className="flex items-center gap-1.5 font-medium text-brand-ink" aria-current="page">
              <ChevronRight className="size-4" aria-hidden />
              Плащане
            </li>
          </ol>
        </nav>

        <section className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
          <div className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
              <Wallet className="size-7" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-bold text-brand-ink">{fee.title}</h1>
            <p className="mt-3 text-4xl font-bold tracking-tight text-brand-rose">{formatPrice(fee.price)}</p>
            <p className="mt-1 text-sm text-brand-ink/60">за една обява</p>
          </div>

          <div className="mt-5 border-t border-black/5 pt-5">
            {checkout.ok ? (
              <CardPaymentForm
                clientSecret={checkout.clientSecret}
                publishableKey={checkout.publishableKey}
                price={formatPrice(fee.price)}
              />
            ) : (
              <p role="alert" className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">
                {checkout.message}
              </p>
            )}
          </div>

          <Link
            href="/profile/listings"
            className="mt-2 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-brand-ink/60 transition-colors hover:text-brand-rose"
          >
            Към моите обяви
          </Link>
        </section>
      </div>
    </main>
  );
}
