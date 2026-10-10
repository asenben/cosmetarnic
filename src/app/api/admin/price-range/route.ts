import { getAdmin } from "@/lib/admin";
import { setPriceRange } from "@/lib/options";

// Sets the ends of the price slider in the filters.
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
    const result = await setPriceRange(body as Record<string, unknown>);
    if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Price range could not be saved", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
