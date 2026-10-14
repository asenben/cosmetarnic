"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import type { PaymentOutcome } from "@/components/payments/PaymentNotice";
import Select from "@/components/Select";
import { loadStripe, type StripeClient, type StripeElements } from "@/lib/payments/stripeJs";

type CardPaymentFormProps = {
  // What Stripe gave for this payment and for this site (see src/lib/payments/createCheckout).
  clientSecret: string;
  publishableKey: string;
  // The price as the button shows it: "0,80 €".
  price: string;
};

const GENERIC_ERROR = "Плащането не можа да бъде направено. Опитай отново след малко.";

// The site's colours, as globals.css names them. Stripe draws the card fields in a frame of its
// own, where the stylesheet does not reach, so their values are read off the page and handed over.
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined;

const appearance = () => ({
  theme: "stripe",
  variables: {
    colorPrimary: token("--color-brand-rose"),
    colorText: token("--color-brand-ink"),
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    fontSizeBase: "14px",
    borderRadius: "12px",
  },
  rules: {
    ".Label": { fontWeight: "500", marginBottom: "6px" },
    ".Input": { boxShadow: "none", borderColor: "rgba(0, 0, 0, 0.1)", padding: "11px 14px" },
    ".Input:focus": { boxShadow: "none", borderColor: token("--color-brand-rose") },
    ".Input--invalid": { boxShadow: "none" },
  },
});

// The countries a card can be from, by their two-letter codes: Europe, with Bulgaria first as the
// one most sellers are in. Their names are taken from the browser, in Bulgarian.
const COUNTRY_CODES = [
  "AT", "BE", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT",
  "LI", "LT", "LU", "LV", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "SE", "SI", "SK", "TR",
];
const DEFAULT_COUNTRY = "BG";

const countryNames = new Intl.DisplayNames("bg", { type: "region" });
const collator = new Intl.Collator("bg");
const countries = [
  { value: DEFAULT_COUNTRY, label: countryNames.of(DEFAULT_COUNTRY) ?? DEFAULT_COUNTRY },
  ...COUNTRY_CODES.map((code) => ({ value: code, label: countryNames.of(code) ?? code })).sort((a, b) =>
    collator.compare(a.label, b.label),
  ),
];

// The fields are in Inter like the rest of the site; inside Stripe's frame it is loaded separately.
const fonts = [{ cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" }];

// The card fields for one payment, with the site's look. The card's details go straight from
// the browser to Stripe and never reach this site.
export default function CardPaymentForm({ clientSecret, publishableKey, price }: CardPaymentFormProps) {
  const router = useRouter();
  const fieldsRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<{ stripe: StripeClient; elements: StripeElements }>(null);
  const [ready, setReady] = useState(false);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let unmount: (() => void) | undefined;

    loadStripe(publishableKey)
      .then((stripe) => {
        if (cancelled || !fieldsRef.current) return;
        const elements = stripe.elements({ clientSecret, appearance: appearance(), fonts });
        // The country is asked for below with the site's own dropdown: the one Stripe draws opens
        // the browser's plain list, which cannot be styled.
        const fields = elements.create("payment", {
          layout: "tabs",
          fields: { billingDetails: { address: { country: "never" } } },
        });
        fields.on("ready", () => setReady(true));
        fields.on("loaderror", () => setError("Полетата за картата не можаха да се заредят. Презареди страницата."));
        fields.mount(fieldsRef.current);
        stripeRef.current = { stripe, elements };
        unmount = () => fields.destroy();
      })
      .catch(() => {
        if (!cancelled) setError("Връзката със Stripe не можа да се осъществи. Провери връзката си и презареди страницата.");
      });

    return () => {
      cancelled = true;
      stripeRef.current = null;
      unmount?.();
    };
  }, [clientSecret, publishableKey]);

  const pay = async () => {
    const loaded = stripeRef.current;
    if (!loaded) return;
    setPaying(true);
    setError(undefined);

    // The bank's confirmation usually opens over this page; when it needs a page of its own,
    // Stripe sends the seller back to the form with the payment's id in the address.
    const { error: failure, paymentIntent } = await loaded.stripe.confirmPayment({
      elements: loaded.elements,
      confirmParams: {
        return_url: `${window.location.origin}/sell`,
        payment_method_data: { billing_details: { address: { country } } },
      },
      redirect: "if_required",
    });
    if (failure || !paymentIntent) {
      // A field filled in wrong is already marked under the field itself.
      if (failure?.type !== "validation_error") setError(failure?.message ?? GENERIC_ERROR);
      setPaying(false);
      return;
    }
    // The payment is checked and counted before leaving, so that this page stays up until the
    // form is ready to open with the outcome. Unless told otherwise, it may well have gone through.
    let outcome: PaymentOutcome = "pending";
    try {
      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentIntent.id }),
      });
      const result = await response.json();
      if (response.ok && result.outcome) outcome = result.outcome;
    } catch {}
    router.push(`/sell?payment=${outcome}`);
  };

  return (
    <div>
      <div className="relative min-h-40">
        {!ready && !error && (
          <p role="status" className="absolute inset-0 flex items-center justify-center text-sm text-brand-ink/50">
            Зареждане на полетата за картата…
          </p>
        )}
        <div ref={fieldsRef} />
      </div>

      {ready && (
        <div className="mt-3">
          <p className="mb-1.5 text-sm font-medium text-brand-ink">Държава</p>
          <Select
            label="Държава"
            options={countries}
            value={country}
            onChange={setCountry}
            // Shaped like the card fields above it, which are rounder than the site's other dropdowns.
            className="h-11 w-full rounded-xl! pl-3.5! [&>span]:font-normal"
          />
        </div>
      )}

      <div className="mt-5 space-y-2">
        <button
          type="button"
          disabled={!ready || paying}
          onClick={pay}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-rose text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-70"
        >
          <CreditCard className="size-4" aria-hidden />
          {paying ? "Плащане…" : `Плати ${price}`}
        </button>
        {error && (
          <p role="alert" className="text-center text-xs text-red-600">
            {error}
          </p>
        )}
        <p className="flex items-center justify-center gap-1.5 text-center text-xs leading-none text-brand-ink/50">
          {/* The icon's drawing sits high in its box; nudged to the middle of the letters. */}
          <Lock className="size-3.5 shrink-0 translate-y-px" aria-hidden />
          Картата се обработва от Stripe и не се пази на сайта.
        </p>
      </div>
    </div>
  );
}
