import { avatarUrl } from "@/lib/auth/avatar";
import { getCurrentUser } from "@/lib/auth/session";
import { postedAgo } from "@/lib/listings";
import { listConversations, startConversation } from "@/lib/messages";

// How many of the latest conversations the navigation's list shows.
const LATEST = 8;

// The signed-in user's latest conversations and how many messages wait unopened, for the
// messages button in the navigation.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  try {
    const conversations = await listConversations(user.id);
    return Response.json({
      unread: conversations.reduce((sum, { unread }) => sum + unread, 0),
      conversations: conversations.slice(0, LATEST).map((conversation) => ({
        id: conversation.id,
        username: conversation.other.username,
        avatar: avatarUrl(conversation.other.avatar),
        admin: conversation.other.admin,
        subject: conversation.subject,
        lastBody: conversation.lastBody,
        lastMine: conversation.lastMine,
        ago: postedAgo(conversation.lastAt),
        unread: conversation.unread,
      })),
    });
  } catch (error) {
    console.error("Conversations could not be listed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

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
