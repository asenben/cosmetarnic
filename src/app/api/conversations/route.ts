import { getCurrentUser } from "@/lib/auth/session";
import { startConversation } from "@/lib/messages";

// Opens the conversation with whoever published a "Търся" post (`requestId`) or a listing
// (`listingId`) and answers with its id. It is made the first time the two write about it.
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
    const result = await startConversation(user.id, body as Record<string, unknown>);
    if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
    return Response.json({ id: result.id });
  } catch (error) {
    console.error("Conversation could not be started", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
