import { getCurrentUser } from "@/lib/auth/session";
import { checkoutOutcome } from "@/lib/payments/createCheckout";

// Called by the payment page right after the card is charged: the payment is checked with Stripe
// and counted, and the answer says how it went, for the seller to be told at the form.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const id = typeof body === "object" && body !== null && "id" in body ? body.id : undefined;
  if (typeof id !== "string") return Response.json({ message: "Невалидна заявка." }, { status: 400 });

  return Response.json({ outcome: await checkoutOutcome(user, id) });
}
