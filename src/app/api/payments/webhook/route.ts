import { recordPayment } from "@/lib/payments/createCheckout";
import { isFromStripe, type PaymentIntent } from "@/lib/payments/stripe";

// Where Stripe reports a finished payment by itself, so that it is counted even if the seller
// closes the browser before coming back to the site. Only notifications signed by Stripe count.
export async function POST(request: Request) {
  const body = await request.text();
  if (!isFromStripe(body, request.headers.get("stripe-signature"))) return new Response(null, { status: 400 });

  try {
    const event = JSON.parse(body) as { type?: string; data?: { object?: PaymentIntent } };
    if (event.type === "payment_intent.succeeded" && event.data?.object) await recordPayment(event.data.object);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe notification could not be handled", error);
    // Stripe sends it again later.
    return new Response(null, { status: 500 });
  }
}
