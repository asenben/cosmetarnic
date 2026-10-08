import { getCurrentUser } from "@/lib/auth/session";
import { createRequest } from "@/lib/requests";

// Publishes a "Търся" post: what the signed-in user is looking for.
export async function POST(request: Request) {
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
    const result = await createRequest(user.id, body as Record<string, unknown>);
    if (!result.ok) {
      return Response.json({ message: "Провери отбелязаните полета.", errors: result.errors }, { status: 400 });
    }
    return Response.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error("Request could not be saved", error);
    return Response.json({ message: "Не успяхме да публикуваме. Опитай отново." }, { status: 500 });
  }
}
