import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PaymentPreview from "@/components/payments/PaymentPreview";
import UpgradePlanForm from "@/components/payments/UpgradePlanForm";
import { getAdmin } from "@/lib/admin";
import { bankTransfer, getListingFee, listPaidSellers, transferReference } from "@/lib/payments/canCreateListing";

export const metadata: Metadata = {
  title: "Плащания",
};

const card = "rounded-2xl border border-black/5 bg-white p-5 sm:p-6";

// The paid listings, for the administrator to edit, and the sellers who have paid for listings
// they have not published yet. Paid listings are added to a seller from the seller's page in
// "Потребители".
export default async function AdminPayments() {
  const admin = await getAdmin();
  if (!admin) notFound();
  const [fee, sellers] = await Promise.all([getListingFee(), listPaidSellers()]);

  return (
    <div className="space-y-4">
      <section className={card}>
        <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Плащания</h1>
        <p className="mt-1 text-sm text-brand-ink/60">
          Платени обяви. Когато продавач има толкова обяви, колкото са безплатните, и започне да качва следващата,
          вижда прозорец с това описание, цената и банковата сметка, по която да я преведе с основание „Обява
          &lt;потребителско име&gt;“. Щом преводът пристигне, добави платената обява от страницата на продавача в
          „Потребители“.
        </p>
        <UpgradePlanForm fee={fee} />
        <PaymentPreview
          limit={fee.freeListings}
          fee={bankTransfer(fee)}
          reference={transferReference(admin.username)}
        />
      </section>

      <section className={card}>
        <h2 className="text-xl font-bold text-brand-ink">Платени и още некачени обяви ({sellers.length})</h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          Платената обява се добавя от страницата на продавача в „Потребители“, след като преводът му пристигне. Всяка качена обява над безплатните изразходва по една.
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

    </div>
  );
}
