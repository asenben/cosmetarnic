"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, Lock, Wallet } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import PaymentNotice, { type PaymentOutcome } from "@/components/payments/PaymentNotice";
import { formatPrice } from "@/lib/format";

type PaymentModalProps = {
  // The paid listing as the administrator set it in "Плащания".
  fee: { title: string; description: string; price: number };
  // How many listings are free.
  limit: number;
  // How the seller's last try at paying ended, when it did not end with a payment.
  outcome?: PaymentOutcome;
  // Given where the window is only being looked at (the administrator's preview): called once it
  // has closed, in place of leaving for the seller's listings.
  onClosed?: () => void;
};

// Slides up over the "Добави обява" page, like the form for signing in, when a seller who has
// used up the free listings starts one more: it says what that listing costs, and its button
// leads to the payment page, where it is paid for by card.
// Closing it leads to the seller's listings, since the new one cannot be published yet.
export default function PaymentModal({ fee, limit, outcome, onClosed }: PaymentModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string>();

  // Goes to the page where the card is entered. Coming back paid opens the form.
  const pay = () => {
    // Nothing is charged from the administrator's preview.
    if (onClosed) return setError("Това е само преглед: тук продавачът отива към плащането с карта.");
    setPaying(true);
    router.push("/sell/pay");
  };

  // Opened once the page is there, so that the panel is seen sliding in.
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    // After the panel has slid away.
    setTimeout(() => (onClosed ? onClosed() : router.push("/profile/listings")), 400);
  };

  return (
    <AuthModal open={open} onClose={close} label={fee.title}>
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
          <Wallet className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-bold text-brand-ink">{fee.title}</h2>
        <p className="mt-2 text-sm leading-6 text-brand-ink/60">
          Вече имаш {limit} безплатни {limit === 1 ? "обява" : "обяви"}. За да качиш следващата, тя трябва да бъде
          заплатена.
        </p>
      </div>

      {outcome && <PaymentNotice outcome={outcome} className="mt-4" />}

      <div className="mt-5 border-y border-black/5 py-5 text-center">
        <p className="text-4xl font-bold tracking-tight text-brand-rose">{formatPrice(fee.price)}</p>
        <p className="mt-1 text-sm text-brand-ink/60">за една обява</p>
      </div>

      {fee.description && (
        <p className="mt-4 text-sm leading-6 wrap-anywhere whitespace-pre-line text-brand-ink/80">{fee.description}</p>
      )}

      <div className="mt-6 space-y-2">
        <button
          type="button"
          disabled={paying}
          onClick={pay}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-rose text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-70"
        >
          <CreditCard className="size-4" aria-hidden />
          {paying ? "Отваряне на плащането…" : `Плати ${formatPrice(fee.price)}`}
        </button>
        {error && (
          <p role="alert" className="text-center text-xs text-red-600">
            {error}
          </p>
        )}
        <p className="flex items-center justify-center gap-1.5 text-xs leading-none text-brand-ink/50">
          {/* The icon's drawing sits high in its box; nudged to the middle of the letters. */}
          <Lock className="size-3.5 shrink-0 translate-y-px" aria-hidden />
          Плащането с карта се обработва от Stripe.
        </p>
        <Link
          href="/profile/listings"
          onClick={(event) => {
            // In the preview the link only closes the window.
            if (!onClosed) return;
            event.preventDefault();
            close();
          }}
          className="flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-brand-ink/60 transition-colors hover:text-brand-rose"
        >
          Към моите обяви
        </Link>
      </div>
    </AuthModal>
  );
}
