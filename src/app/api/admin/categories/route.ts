import { getAdmin } from "@/lib/admin";
import { addCategory } from "@/lib/categories";

// Adds a category to the site. Like the panel's pages, this does not admit to existing for
// anybody who is not an administrator.
export async function POST(request: Request) {
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
    const result = await addCategory(body as Record<string, unknown>);
    if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Category could not be added", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
