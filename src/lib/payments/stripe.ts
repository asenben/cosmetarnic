import { createHmac, timingSafeEqual } from "node:crypto";

// Talks to Stripe over its HTTP API, which needs nothing installed. The keys are read from the
// environment: STRIPE_SECRET_KEY for every call, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for the card
// fields in the browser, and STRIPE_WEBHOOK_SECRET for checking that a notification really comes
// from Stripe.

// The key the seller's browser shows Stripe's card fields with. It is meant to be seen; a secret
// key put there by mistake is not handed out.
export const publishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return key?.startsWith("pk_") ? key : undefined;
};

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY && publishableKey());

// The part of a payment this site reads.
export type PaymentIntent = {
  id: string;
  // "succeeded" once the money is taken; "processing" while the bank has not answered yet.
  status: string;
  // In the smallest unit of the currency: cents.
  amount: number;
  // What the browser needs to show the card fields for this payment.
  client_secret: string | null;
  metadata: { user_id?: string };
};

// The version of Stripe's API the site is written for. Later ones no longer let a payment be
// limited to cards from here, and offer whatever is switched on in the Dashboard instead.
const API_VERSION = "2025-02-24.acacia";

async function stripeRequest<T>(path: string, params?: Record<string, string>): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Stripe-Version": API_VERSION,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params && new URLSearchParams(params),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Stripe: ${result?.error?.message ?? response.status}`);
  return result as T;
}

type NewPayment = {
  // What is paid for, as it is written down in Stripe.
  name: string;
  // In euro.
  price: number;
  // The user who pays; it comes back with the payment.
  userId: string;
};

// Starts one card payment. The card is entered on this site, in fields that Stripe draws.
export const createPaymentIntent = ({ name, price, userId }: NewPayment) =>
  stripeRequest<PaymentIntent>("payment_intents", {
    amount: String(Math.round(price * 100)),
    currency: "eur",
    "payment_method_types[0]": "card",
    description: name,
    "metadata[user_id]": userId,
  });

export const getPaymentIntent = (id: string) =>
  stripeRequest<PaymentIntent>(`payment_intents/${encodeURIComponent(id)}`);

// How old a notification may be, in seconds, before it is taken for a replay.
const TOLERANCE = 300;

// Whether a notification was signed by Stripe with the webhook's secret: the `Stripe-Signature`
// header carries the time and an HMAC of "<time>.<body>".
export function isFromStripe(body: string, header: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = header.split(",").map((part) => part.split("=") as [string, string]);
  const time = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!time || Math.abs(Date.now() / 1000 - Number(time)) > TOLERANCE) return false;

  const expected = Buffer.from(createHmac("sha256", secret).update(`${time}.${body}`).digest("hex"));
  return signatures.some((signature) => {
    const given = Buffer.from(signature);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}