import { getCurrentUser } from "@/lib/auth/session";
import { countUnreadMessages } from "@/lib/messages";

// How many messages the signed-in user has not opened yet, for the number on the messages button
// of the navigation. A visitor has none.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ count: 0 });

  try {
    return Response.json({ count: await countUnreadMessages(user.id) });
  } catch (error) {
    console.error("Unread messages could not be counted", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
