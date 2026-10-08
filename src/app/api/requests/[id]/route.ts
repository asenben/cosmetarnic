import { getCurrentUser } from "@/lib/auth/session";
import { deleteRequest, getRequestPhone, updateRequest } from "@/lib/requests";

const NOT_FOUND = "Публикацията не е намерена.";

// The phone number left on a "Търся" post. Only for signed-in users, so the numbers cannot be
// collected by anybody who opens the page.
export async function GET(_request: Request, { params }: RouteContext<"/api/requests/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  try {
    const phone = await getRequestPhone((await params).id);
    if (!phone) return Response.json({ message: NOT_FOUND }, { status: 404 });
    return Response.json({ phone });
  } catch (error) {
    console.error("Request's phone could not be loaded", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

// Saves the author's changes to their post.
export async function PATCH(request: Request, { params }: RouteContext<"/api/requests/[id]">) {
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
    const result = await updateRequest(user.id, (await params).id, body as Record<string, unknown>);
    if (!result) return Response.json({ message: NOT_FOUND }, { status: 404 });
    if (!result.ok) {
      return Response.json({ message: "Провери отбелязаните полета.", errors: result.errors }, { status: 400 });
    }
    return Response.json({ id: result.id });
  } catch (error) {
    console.error("Request could not be updated", error);
    return Response.json({ message: "Не успяхме да запазим промените. Опитай отново." }, { status: 500 });
  }
}

// Deletes the author's own post.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/requests/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  try {
    if (!(await deleteRequest(user.id, (await params).id))) {
      return Response.json({ message: NOT_FOUND }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Request could not be deleted", error);
    return Response.json({ message: "Не успяхме да изтрием публикацията. Опитай отново." }, { status: 500 });
  }
}
