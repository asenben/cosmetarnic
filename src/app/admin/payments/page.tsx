import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PaymentPreview from "@/components/payments/PaymentPreview";
import UpgradePlanForm from "@/components/payments/UpgradePlanForm";
import { getAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { getListingFee, listPaidSellers } from "@/lib/payments/canCreateListing";
import { listPayments } from "@/lib/payments/createCheckout";
import { stripeConfigured } from "@/lib/payments/stripe";

export const metadata: Metadata = {
  title: "Плащания",
};

const card = "rounded-2xl border border-black/5 bg-white p-5 sm:p-6";
const dateFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

// The paid listings, for the administrator to edit, and the sellers who have paid for listings
// they have not published yet. Paid listings are added to a seller from the seller's page in
// "Потребители".
export default async function AdminPayments() {
  if (!(await getAdmin())) notFound();
  const [fee, sellers, payments] = await Promise.all([getListingFee(), listPaidSellers(), listPayments()]);

  return (
    <div className="space-y-4">
      <section className={card}>
        <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Плащания</h1>
        <p className="mt-1 text-sm text-brand-ink/60">
          Платени обяви. Когато продавач има толкова обяви, колкото са безплатните, и започне да качва следващата,
          вижда прозорец с това описание и цената, която плаща с карта през Stripe.
        </p>
        {!stripeConfigured() && (
          <p className="mt-4 rounded-xl bg-amber-100 px-3.5 py-2.5 text-sm text-amber-900">
            Stripe още не е свързан: във файла .env липсва ключът STRIPE_SECRET_KEY или
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (той започва с pk_). Докато ги няма, страницата за плащане ще казва
            на продавача, че плащането с карта не е настроено.
          </p>
        )}
        <UpgradePlanForm fee={fee} />
        <PaymentPreview
          limit={fee.freeListings}
          fee={{ title: fee.title, description: fee.description, price: fee.price }}
        />
      </section>

      <section className={card}>
        <h2 className="text-xl font-bold text-brand-ink">Платени и още некачени обяви ({sellers.length})</h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          Платената обява се добавя сама след плащане с карта. Може да се добави или махне и ръчно от страницата на
          продавача в „Потребители“. Всяка качена обява над безплатните изразходва по една.
        </p>
        {sellers.length > 0 ? (
          <ul className="mt-3 divide-y divide-black/5">
            {sellers.map(({ id, username, credits }) => (
              <li key={id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link href={`/admin/users/${id}`} className="min-w-0 truncate font-semibold text-brand-rose hover:underline">
                  {username}
                </Link>
                <span className="shrink-0 text-brand-ink/60">
                  {credits} {credits === 1 ? "платена обява" : "платени обяви"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-brand-ink/60">Няма продавачи с платени обяви, които чакат качване.</p>
        )}
      </section>

      <section className={card}>
        <h2 className="text-xl font-bold text-brand-ink">Последни плащания с карта ({payments.length})</h2>
        {payments.length > 0 ? (
          <ul className="mt-3 divide-y divide-black/5">
            {payments.map(({ id, userId, username, amount, paidAt }) => (
              <li key={id} className="flex items-center justify-between gap-3 py-3 text-sm">
                {userId ? (
                  <Link href={`/admin/users/${userId}`} className="min-w-0 truncate font-semibold text-brand-rose hover:underline">
                    {username}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate font-semibold text-brand-ink/60">{username} (изтрит профил)</span>
                )}
                <span className="shrink-0 text-brand-ink/60">
                  {dateFormat.format(paidAt)} · <span className="font-bold text-brand-ink">{formatPrice(amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-brand-ink/60">Още няма плащания.</p>
        )}
      </section>
    </div>
  );
}
