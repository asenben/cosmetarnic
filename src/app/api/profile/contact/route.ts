import { updateContact } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";

// Saves the card on "Моят профил" that every listing and "Търся" post takes its phone, town and
// ways of handing over from.
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
    const result = await updateContact(user.id, body as Record<string, unknown>);
    if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact details could not be saved", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
