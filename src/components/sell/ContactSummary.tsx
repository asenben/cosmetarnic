import Link from "next/link";
import { MapPin, Phone, Truck, type LucideIcon } from "lucide-react";
import { deliveryLabels } from "@/lib/listings/delivery";

type ContactSummaryProps = {
  phone: string;
  city: string;
  // Left out for a "Търся" post, which has no ways of handing over.
  delivery?: string[];
  // What is still to be set in the profile before publishing, if anything.
  missing?: string;
};

// The phone, the town and the ways of handing over as set on "Моят профил", in place of fields to
// fill in: they are the same on all of the user's listings and posts. A phone or town the user
// chose to hide arrives empty.
export default function ContactSummary({ phone, city, delivery, missing }: ContactSummaryProps) {
  const rows: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Phone, label: "Телефон", value: phone },
    { icon: MapPin, label: "Град", value: city },
    ...(delivery ? [{ icon: Truck, label: "Изпращане", value: deliveryLabels(delivery).join(", ") }] : []),
  ];

  return (
    <div className="rounded-xl bg-zinc-100 px-4 py-3 text-sm">
      <dl className="space-y-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <dt className="flex shrink-0 items-center gap-2 text-brand-ink/60">
              <Icon className="size-4 text-brand-rose" aria-hidden />
              {label}
            </dt>
            <dd className={`text-right font-semibold ${value ? "text-brand-ink" : "font-normal text-brand-ink/40"}`}>
              {value || "не се показва"}
            </dd>
          </div>
        ))}
      </dl>
      {missing && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {missing}
        </p>
      )}
      <Link
        href="/profile"
        className="mt-2 inline-block text-xs font-semibold text-brand-rose underline-offset-4 hover:underline"
      >
        Промени в „Моят профил“
      </Link>
    </div>
  );
}
