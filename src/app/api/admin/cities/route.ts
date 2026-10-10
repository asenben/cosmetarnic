import { getAdmin } from "@/lib/admin";
import { addCity } from "@/lib/options";

// Adds a town to the ones the filters and the forms offer. Like the panel's pages, this does not
// admit to existing for anybody who is not an administrator.
export async function POST(request: Request) {
  if (!(await getAdmin())) return new Response(null, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Невалидна заявка." }, { status: 400 });
  }
  const name = typeof body === "object" && body !== null ? (body as Record<string, unknown>).name : undefined;

  try {
    const result = await addCity(name);
    if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Town could not be added", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
