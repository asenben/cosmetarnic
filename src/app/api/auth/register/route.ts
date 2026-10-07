import { registerUser } from "@/lib/auth/register";

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
    const result = await registerUser(body as Record<string, unknown>, new URL(request.url).origin);
    if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });
    return Response.json({ user: result.user, emailSent: result.emailSent }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
