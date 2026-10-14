import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { createListing } from "@/lib/listings";
import { canCreateListing, getListingFee, spendPaidListing } from "@/lib/payments/canCreateListing";

// Publishes a listing. Its photos were uploaded beforehand through /api/listings/images and arrive
// here as file names.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Невалидна заявка." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return Response.json({ message: "Невалидна заявка." }, { status: 400 });
  }

  try {
    // The page shows what the listing costs instead of the form; this is for whatever gets past it.
    const allowance = await canCreateListing(user);
    if (!allowance.allowed) {
      const { price } = await getListingFee();
      return Response.json(
        {
          message: `Вече имаш ${allowance.limit} безплатни обяви. Следващата струва ${formatPrice(price)} и трябва да бъде заплатена, преди да я качиш.`,
        },
        { status: 402 },
      );
    }
    const result = await createListing(user.id, body as Record<string, unknown>);
    if (!result.ok) {
      return Response.json({ message: "Провери отбелязаните полета.", errors: result.errors }, { status: 400 });
    }
    // A listing past the free ones uses up one of those the seller paid for.
    if (allowance.paid) await spendPaidListing(user.id);
    return Response.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error("Listing could not be saved", error);
    return Response.json({ message: "Не успяхме да качим обявата. Опитай отново." }, { status: 500 });
  }
}
