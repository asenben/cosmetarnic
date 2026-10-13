import { getAdmin } from "@/lib/admin";
import { setListingFee } from "@/lib/payments/canCreateListing";

// Saves what a listing past the free ones costs, as the administrator set it in "Плащания". Like
// the panel's pages, this does not admit to existing for anybody who is not an administrator.
export async function PUT(request: Request) {
  if (!(await getAdmin())) return new Response(null, { status: 404 });

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
    const result = await setListingFee(body as Record<string, unknown>);
    if (!result.ok) {
      return Response.json({ message: "Провери отбелязаните полета.", errors: result.errors }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Listing fee could not be saved", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
