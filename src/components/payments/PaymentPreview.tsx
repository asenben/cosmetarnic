"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import PaymentModal from "@/components/payments/PaymentModal";

type PaymentPreviewProps = {
  fee: { title: string; description: string; price: number };
  limit: number;
};

// Lets the administrator see the window a seller gets past the free listings, as it is saved
// now. Administrators are never asked to pay, so they would not meet it otherwise.
export default function PaymentPreview({ fee, limit }: PaymentPreviewProps) {
  const [shown, setShown] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShown(true)}
        className="mt-4 flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-brand-rose px-4 text-sm font-semibold text-brand-rose transition-colors hover:bg-brand-rose/10"
      >
        <Eye className="size-4" aria-hidden />
        Виж прозореца, както го вижда продавачът
      </button>
      {shown && <PaymentModal fee={fee} limit={limit} onClosed={() => setShown(false)} />}
    </>
  );
}
