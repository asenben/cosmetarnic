"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Copy, Gift, Landmark, Wallet } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { formatPrice } from "@/lib/format";

export type BankTransferFee = {
  title: string;
  description: string;
  price: number;
  recipient: string;
  // Already in groups of four, as banks print it.
  iban: string;
  bic: string;
};

type PaymentModalProps = {
  // The paid listing and the platform's account, as the administrator set them in "Плащания".
  fee: BankTransferFee;
  // How many listings are free.
  limit: number;
  // What the seller writes as the reason for the transfer, so the administrator can tell whose it is.
  reference: string;
  // Given where the window is only being looked at (the administrator's preview): called once it
  // has closed, in place of leaving for the seller's listings.
  onClosed?: () => void;
};

// One line of the transfer's details; the ones the seller has to type exactly can be copied.
function Detail({ label, value, copy = false }: { label: string; value: string; copy?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyValue = async () => {
    try {
      // The IBAN is copied without the spaces it is shown with, as bank forms want it.
      await navigator.clipboard.writeText(label === "IBAN" ? value.replaceAll(" ", "") : value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-brand-ink/60">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 text-right font-semibold wrap-anywhere text-brand-ink">
        {value}
        {copy && (
          <button
            type="button"
            onClick={copyValue}
            aria-label={copied ? "Копирано" : `Копирай ${label}`}
            title={copied ? "Копирано" : "Копирай"}
            className="-mr-1.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-brand-ink/50 transition-colors hover:bg-brand-rose/10 hover:text-brand-rose"
          >
            {copied ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          </button>
        )}
      </dd>
    </div>
  );
}

// Slides up over the "Добави обява" page, like the form for signing in, when a seller who has
// used up the free listings starts one more: it says what that listing costs and gives the
// platform's bank account to transfer the money to. Once the transfer has arrived, the
// administrator adds the paid listing and the form opens again.
// Closing it leads to the seller's listings, since the new one cannot be published yet.
export default function PaymentModal({ fee, limit, reference, onClosed }: PaymentModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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

      <div className="mt-5 border-y border-black/5 py-5 text-center">
        <p className="text-4xl font-bold tracking-tight text-brand-rose">{formatPrice(fee.price)}</p>
        <p className="mt-1 text-sm text-brand-ink/60">за една обява</p>
      </div>

      {fee.description && (
        <p className="mt-4 text-sm leading-6 wrap-anywhere whitespace-pre-line text-brand-ink/80">{fee.description}</p>
      )}

      <section className="mt-5 rounded-2xl bg-brand-rose/5 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-brand-ink">
          <Landmark className="size-4.5 text-brand-rose" aria-hidden />
          Начин на плащане: банков превод
        </h3>
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-brand-ink/70">
          <Gift className="mt-0.5 size-3.5 shrink-0 text-brand-rose" aria-hidden />
          До {limit} безплатни {limit === 1 ? "обява" : "обяви"} на потребител. Плаща се само всяка следваща.
        </p>

        {fee.iban ? (
          <dl className="mt-3 divide-y divide-black/5 text-sm">
            <Detail label="Получател" value={fee.recipient} />
            <Detail label="IBAN" value={fee.iban} copy />
            {fee.bic && <Detail label="BIC" value={fee.bic} />}
            <Detail label="Сума" value={formatPrice(fee.price)} />
            <Detail label="Основание" value={reference} copy />
          </dl>
        ) : (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
            Сметката за плащане още не е въведена. Опитай отново по-късно.
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-brand-ink/60">
          Напиши основанието точно така, за да разпознаем превода ти. Обявата се отключва, щом парите пристигнат –
          обикновено до един работен ден.
        </p>
      </section>

      <Link
        href="/profile/listings"
        onClick={(event) => {
          // In the preview the link only closes the window.
          if (!onClosed) return;
          event.preventDefault();
          close();
        }}
        className="mt-4 flex h-11 items-center justify-center rounded-xl bg-brand-rose text-sm font-semibold text-white transition-colors hover:bg-brand"
      >
        Към моите обяви
      </Link>
    </AuthModal>
  );
}
