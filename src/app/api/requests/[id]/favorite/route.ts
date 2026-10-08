import { getCurrentUser } from "@/lib/auth/session";
import { setRequestFavorite } from "@/lib/requests";

async function change(id: string, favorite: boolean) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  try {
    if (!(await setRequestFavorite(user.id, id, favorite))) {
      return Response.json({ message: "Публикацията не е намерена." }, { status: 404 });
    }
    return Response.json({ favorite });
  } catch (error) {
    console.error("Request's heart could not be changed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

// Marks the "Търся" post with the heart for the signed-in user.
export async function PUT(_request: Request, { params }: RouteContext<"/api/requests/[id]/favorite">) {
  return change((await params).id, true);
}

// Takes the heart off the post.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/requests/[id]/favorite">) {
  return change((await params).id, false);
}
