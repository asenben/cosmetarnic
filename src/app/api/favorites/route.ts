import { getCurrentUser } from "@/lib/auth/session";
import { getFavoriteIds } from "@/lib/listings/favorites";

// The ids of the signed-in user's favourite listings; nobody signed in has none.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ids: [] });

  try {
    return Response.json({ ids: await getFavoriteIds(user.id) });
  } catch (error) {
    console.error("Favourites could not be loaded", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
