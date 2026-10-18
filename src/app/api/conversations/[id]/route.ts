import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { openConversation, sendMessage } from "@/lib/messages";
import { notifyNewMessage } from "@/lib/messages/notify";

const NOT_FOUND = "Разговорът не е намерен.";

// The messages of one of the user's conversations, for the open conversation to stay up to date.
export async function GET(_request: Request, { params }: RouteContext<"/api/conversations/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  try {
    const opened = await openConversation(user.id, (await params).id);
    if (!opened) return Response.json({ message: NOT_FOUND }, { status: 404 });
    return Response.json({ messages: opened.messages });
  } catch (error) {
    console.error("Conversation could not be loaded", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

// Sends a message in the conversation and answers with its messages, the new one included.
export async function POST(request: Request, { params }: RouteContext<"/api/conversations/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Невалидна заявка." }, { status: 400 });
  }
  const text = typeof body === "object" && body !== null ? (body as Record<string, unknown>).body : undefined;

  try {
    const { id } = await params;
    const result = await sendMessage(user.id, id, text);
    if (!result) return Response.json({ message: NOT_FOUND }, { status: 404 });
    if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
    // The other person is told by email once the answer has gone back, so the sender does not
    // wait for the mail service; a failure there does not undo the message.
    const origin = new URL(request.url).origin;
    after(async () => {
      try {
        await notifyNewMessage({ conversationId: id, senderId: user.id, origin });
      } catch (error) {
        console.error("Message email failed", error);
      }
    });
    const opened = await openConversation(user.id, id);
    return Response.json({ messages: opened?.messages ?? [] }, { status: 201 });
  } catch (error) {
    console.error("Message could not be sent", error);
    return Response.json({ message: "Не успяхме да изпратим съобщението. Опитай отново." }, { status: 500 });
  }
}
