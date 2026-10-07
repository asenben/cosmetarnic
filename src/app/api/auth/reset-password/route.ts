import { resetPassword } from "@/lib/auth/reset-password";

export async function POST(request: Request) {
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
    const result = await resetPassword(body as Record<string, unknown>);
    if (!result.ok) return Response.json({ field: result.field, message: result.message }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Password reset failed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
