"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { CircleCheck } from "lucide-react";
import type { FeeErrors, ListingFee } from "@/lib/payments/canCreateListing";

const field =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";

// The form in "Плащания" where the administrator sets the paid listings: whether the limit is on,
// how many listings are free, what each one after them costs, and what the seller is told. The
// payment itself is made by card, through Stripe.
export default function UpgradePlanForm({ fee }: { fee: ListingFee }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FeeErrors>({});
  const [message, setMessage] = useState<string>();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "saving") return;
    const data = new FormData(event.currentTarget);
    setStatus("saving");
    setMessage(undefined);
    try {
      const response = await fetch("/api/admin/listing-fee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(data), enabled: data.get("enabled") === "on" }),
      });
      if (response.ok) {
        setErrors({});
        setStatus("saved");
        router.refresh();
        return;
      }
      const result = await response.json().catch(() => ({}));
      setErrors(result.errors ?? {});
      setMessage(result.message ?? "Нещо се обърка. Опитай отново след малко.");
    } catch {
      setMessage("Нещо се обърка. Провери връзката си и опитай отново.");
    }
    setStatus("idle");
  };

  const label = (text: string, error?: string) => (
    <span className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-semibold text-brand-ink">
      {text}
      {error && (
        <span role="alert" className="text-xs font-normal text-red-600">
          {error}
        </span>
      )}
    </span>
  );

  return (
    <form noValidate onSubmit={onSubmit} onChange={() => status === "saved" && setStatus("idle")} className="mt-5 space-y-5">
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-brand-rose/5 p-4">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={fee.enabled}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-rose"
        />
        <span className="text-sm">
          <span className="block font-semibold text-brand-ink">Платените обяви са включени</span>
          <span className="block text-brand-ink/60">
            Докато е изключено, всички качват обяви без ограничение и на никого не се иска плащане.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          {label("Безплатни обяви", errors.freeListings)}
          <input
            name="freeListings"
            inputMode="numeric"
            defaultValue={fee.freeListings}
            aria-invalid={Boolean(errors.freeListings)}
            className={`${field} h-11`}
          />
        </label>
        <label className="block">
          {label("Цена за една обява, в евро", errors.price)}
          <input
            name="price"
            inputMode="decimal"
            defaultValue={fee.price.toFixed(2).replace(".", ",")}
            aria-invalid={Boolean(errors.price)}
            className={`${field} h-11`}
          />
        </label>
      </div>

      <label className="block">
        {label("Заглавие", errors.title)}
        <input name="title" defaultValue={fee.title} maxLength={60} aria-invalid={Boolean(errors.title)} className={`${field} h-11`} />
      </label>

      <label className="block">
        {label("Описание", errors.description)}
        <textarea
          name="description"
          rows={4}
          defaultValue={fee.description}
          maxLength={600}
          aria-invalid={Boolean(errors.description)}
          className={`${field} resize-y py-2.5 leading-6`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-colors disabled:cursor-default disabled:opacity-60 ${
            status === "saved" ? "bg-emerald-600" : "bg-brand-rose hover:bg-brand"
          }`}
        >
          {status === "saved" && <CircleCheck className="size-4" aria-hidden />}
          <span role="status">
            {status === "saving" ? "Запазване…" : status === "saved" ? "Промените са запазени" : "Запази промените"}
          </span>
        </button>
        {message && (
          <p role="alert" className="text-sm text-red-600">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
