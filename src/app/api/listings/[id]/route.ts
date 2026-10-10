import { getCurrentUser } from "@/lib/auth/session";
import { deleteListing, updateListing } from "@/lib/listings";

const NOT_FOUND = "Обявата не е намерена.";

// Saves the changes to a listing, made by its owner or by an administrator. New photos were uploaded beforehand through
// /api/listings/images; the ones kept from before arrive under the names they already have.
export async function PATCH(request: Request, { params }: RouteContext<"/api/listings/[id]">) {
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
    const result = await updateListing(user, (await params).id, body as Record<string, unknown>);
    if (!result) return Response.json({ message: NOT_FOUND }, { status: 404 });
    if (!result.ok) {
      return Response.json({ message: "Провери отбелязаните полета.", errors: result.errors }, { status: 400 });
    }
    return Response.json({ id: result.id });
  } catch (error) {
    console.error("Listing could not be updated", error);
    return Response.json({ message: "Не успяхме да запазим промените. Опитай отново." }, { status: 500 });
  }
}

// Deletes a listing for good, for its owner or for an administrator.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/listings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  try {
    if (!(await deleteListing(user, (await params).id))) {
      return Response.json({ message: NOT_FOUND }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Listing could not be deleted", error);
    return Response.json({ message: "Не успяхме да изтрием обявата. Опитай отново." }, { status: 500 });
  }
}
