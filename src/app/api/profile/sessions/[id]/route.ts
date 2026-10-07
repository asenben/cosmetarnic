import { revokeSession } from "@/lib/auth/security";
import { getCurrentUser } from "@/lib/auth/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Signs the account out on one of its devices.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/profile/sessions/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  const { id } = await params;
  try {
    if (!UUID.test(id) || !(await revokeSession(user.id, id))) {
      return Response.json({ message: "Сесията не е намерена." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Session could not be ended", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
