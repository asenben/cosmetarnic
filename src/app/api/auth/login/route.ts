import { loginUser } from "@/lib/auth/login";
import { createSession } from "@/lib/auth/session";

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
    const input = body as Record<string, unknown>;
    const result = await loginUser(input, new URL(request.url).origin);
    if (!result.ok) {
      return Response.json({ message: result.message }, { status: result.reason === "invalid" ? 401 : 403 });
    }

    await createSession(result.user.id, input.remember === true, request.headers.get("user-agent"));
    return Response.json({ user: result.user });
  } catch (error) {
    console.error("Login failed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
