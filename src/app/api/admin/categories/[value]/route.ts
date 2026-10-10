import { getAdmin } from "@/lib/admin";
import { deleteCategory, moveCategory, updateCategory } from "@/lib/categories";

// Changes a category: `move` ("up" or "down") shifts it one place in the order, otherwise the
// body carries its new name and picture.
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/categories/[value]">) {
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
    const { value } = await params;
    const result = "move" in change ? await moveCategory(value, change.move) : await updateCategory(value, change);
    if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Category could not be changed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

// Removes a category nothing is published in.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/categories/[value]">) {
  if (!(await getAdmin())) return new Response(null, { status: 404 });

  try {
    const result = await deleteCategory((await params).value);
    if (!result.ok) return Response.json({ message: result.message }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Category could not be deleted", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
