"use client";

import { useEffect } from "react";
import { CircleAlert, CircleCheck, Clock } from "lucide-react";

// How a card payment ended, as the "Добави обява" page is told in its address when the seller
// comes back from paying: /sell?payment=success.
export type PaymentOutcome = "success" | "cancelled" | "pending";

export const PAYMENT_PARAM = "payment";

const notices = {
  success: {
    icon: CircleCheck,
    className: "bg-emerald-50 text-emerald-700",
    text: "Плащането е успешно. Можеш да качиш обявата си.",
  },
  cancelled: {
    icon: CircleAlert,
    className: "bg-red-50 text-red-700",
    text: "Плащането не беше завършено и нищо не е изтеглено от картата ти.",
  },
  // The payment may well have gone through; Stripe also reports it by itself a little later.
  pending: {
    icon: Clock,
    className: "bg-amber-100 text-amber-800",
    text: "Не успяхме да потвърдим плащането в момента. Ако си платил, обявата ще се добави до минута – презареди страницата, преди да плащаш отново.",
  },
};

type PaymentNoticeProps = {
  outcome: PaymentOutcome;
  className?: string;
};

export default function PaymentNotice({ outcome, className = "" }: PaymentNoticeProps) {
  const { icon: Icon, className: tone, text } = notices[outcome];

  // Drop the outcome from the address bar, so that a reload or a shared link doesn't repeat it.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PAYMENT_PARAM)) return;
    url.searchParams.delete(PAYMENT_PARAM);
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <p
      role={outcome === "success" ? "status" : "alert"}
      className={`flex gap-3 rounded-xl p-4 text-left text-sm leading-5 ${tone} ${className}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      {text}
    </p>
  );
}
