import { deleteUser, getAdmin, setUserBlocked, setUserRole, updateUser, type ManageResult } from "@/lib/admin";

const answer = (result: ManageResult) =>
  result.ok
    ? Response.json({ ok: true })
    : Response.json({ message: result.message, errors: result.errors }, { status: result.errors ? 400 : 409 });

// Like the panel's pages, this does not admit to existing for anybody who is not an administrator.
const hidden = () => new Response(null, { status: 404 });

// Changes an account from the panel. The body says what: `details` to save its fields,
// `blocked` to block or unblock it, `role` to make it an administrator or an ordinary user.
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/users/[id]">) {
  const admin = await getAdmin();
  if (!admin) return hidden();

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
    if (typeof change.blocked === "boolean") return answer(await setUserBlocked(admin.id, id, change.blocked));
    if ("role" in change) return answer(await setUserRole(admin.id, id, change.role));
    if (typeof change.details === "object" && change.details !== null) {
      return answer(await updateUser(id, change.details as Record<string, unknown>));
    }
    return Response.json({ message: "Невалидна заявка." }, { status: 400 });
  } catch (error) {
    console.error("Account could not be changed by the administrator", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

// Deletes an account for good, with everything it published.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/users/[id]">) {
  const admin = await getAdmin();
  if (!admin) return hidden();

  try {
    return answer(await deleteUser(admin.id, (await params).id));
  } catch (error) {
    console.error("Account could not be deleted by the administrator", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
