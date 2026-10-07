import { getCurrentUser } from "@/lib/auth/session";
import { createListing } from "@/lib/listings";

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
    const result = await createListing(user.id, body as Record<string, unknown>);
    if (!result.ok) {
      return Response.json({ message: "Провери отбелязаните полета.", errors: result.errors }, { status: 400 });
    }
    return Response.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error("Listing could not be saved", error);
    return Response.json({ message: "Не успяхме да качим обявата. Опитай отново." }, { status: 500 });
  }
}
