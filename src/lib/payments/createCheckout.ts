import type { PaymentOutcome } from "@/components/payments/PaymentNotice";
import { sql } from "@/lib/db";
import { getListingFee } from "@/lib/payments/canCreateListing";
import { sendPaymentEmail } from "@/lib/payments/paymentEmail";
import {
  createPaymentIntent,
  getPaymentIntent,
  publishableKey,
  stripeConfigured,
  type PaymentIntent,
} from "@/lib/payments/stripe";

// Paying by card for a listing past the free ones. The seller enters the card on the site's own
// payment page; once the payment is made, one paid listing is added to the account and the
// seller is back at the form.

const PAYMENT_PATTERN = /^pi_[A-Za-z0-9]{10,200}$/;

type CheckoutResult =
  // What the payment page needs to show Stripe's card fields for this payment.
  { ok: true; clientSecret: string; publishableKey: string } | { ok: false; message: string };

// Starts the payment for one listing.
export async function createCheckout(user: { id: string }): Promise<CheckoutResult> {
  const key = publishableKey();
  if (!stripeConfigured() || !key) return { ok: false, message: "Плащането с карта още не е настроено." };
  const fee = await getListingFee();
  const payment = await createPaymentIntent({ name: fee.title, price: fee.price, userId: user.id });
  return payment.client_secret
    ? { ok: true, clientSecret: payment.client_secret, publishableKey: key }
    : { ok: false, message: "Плащането не можа да започне." };
}

// Adds the paid listing a payment bought, once: the payment's id is written down with it, so the
// same one reported again changes nothing. The seller is told by email, once as well.
export async function recordPayment(payment: PaymentIntent) {
  if (payment.status !== "succeeded" || !payment.metadata.user_id) return false;
  const [user] = await sql`select id, username, email from users where id = ${payment.metadata.user_id}`;
  if (!user) return false;

  const added = await sql`
    insert into payments (id, user_id, username, amount)
    values (${payment.id}, ${user.id}, ${user.username}, ${payment.amount / 100})
    on conflict (id) do nothing returning id`;
  if (added.length === 0) return true;
  await sql`update users set listing_credits = listing_credits + 1 where id = ${user.id}`;

  // The payment counts either way; an email that could not go out is only written down.
  try {
    await sendPaymentEmail({
      username: user.username as string,
      email: user.email as string,
      amount: payment.amount / 100,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Payment email failed", error);
  }
  return true;
}

// Called when the seller comes back from paying: asks Stripe whether that payment was really
// made by this user, and if so counts it. "processing" is a payment the bank has not answered
// for yet, which Stripe reports by itself once it has.
export async function confirmCheckout(user: { id: string }, paymentId: string) {
  if (!stripeConfigured() || !PAYMENT_PATTERN.test(paymentId)) return "unpaid";
  const payment = await getPaymentIntent(paymentId);
  if (payment.metadata.user_id !== user.id) return "unpaid";
  if (payment.status === "processing") return "processing";
  return (await recordPayment(payment)) ? "paid" : "unpaid";
}

// The same, as the seller is told about it. A payment that could not be checked right now may
// well have gone through, so it is not called a failure.
export async function checkoutOutcome(user: { id: string }, paymentId: string): Promise<PaymentOutcome> {
  try {
    const result = await confirmCheckout(user, paymentId);
    return result === "paid" ? "success" : result === "processing" ? "pending" : "cancelled";
  } catch (error) {
    console.error("Payment could not be confirmed", error);
    return "pending";
  }
}

// The latest card payments, for the administrator.
export async function listPayments(limit = 50) {
  const rows = await sql`
    select id, user_id, username, amount, created_at from payments order by created_at desc limit ${limit}`;
  return rows.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string | null,
    username: row.username as string,
    amount: Number(row.amount),
    paidAt: new Date(row.created_at as string),
  }));
}
