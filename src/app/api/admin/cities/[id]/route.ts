import { getAdmin } from "@/lib/admin";
import { deleteCity, moveCity, renameCity } from "@/lib/options";

// Changes a town: `move` ("up" or "down") shifts it one place in the order, otherwise the body
// carries its new name.
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/cities/[id]">) {
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
  const change = body as Record<string, unknown>;

  try {
    const { id } = await params;
    const result = "move" in change ? await moveCity(id, change.move) : await renameCity(id, change.name);
    if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Town could not be changed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

// Takes a town out of the list that is offered.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/cities/[id]">) {
  if (!(await getAdmin())) return new Response(null, { status: 404 });

  try {
    const result = await deleteCity((await params).id);
    if (!result.ok) return Response.json({ message: result.message }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Town could not be deleted", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
