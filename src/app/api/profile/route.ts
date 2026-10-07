import { updateProfile } from "@/lib/auth/profile";
import { deleteAccount } from "@/lib/auth/security";
import { getCurrentUser } from "@/lib/auth/session";

export async function PATCH(request: Request) {
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
    const result = await updateProfile(user.id, body as Record<string, unknown>);
    if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });
    return Response.json({ profile: result.profile });
  } catch (error) {
    console.error("Profile update failed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

// Deletes the signed-in user's account for good. The body carries their password as confirmation.
export async function DELETE(request: Request) {
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
    const result = await deleteAccount(user.id, body as Record<string, unknown>);
    if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Account deletion failed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
