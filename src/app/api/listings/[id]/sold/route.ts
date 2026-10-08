import { getCurrentUser } from "@/lib/auth/session";
import { setListingSold } from "@/lib/listings";

async function change(id: string, sold: boolean) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  try {
    if (!(await setListingSold(user.id, id, sold))) {
      return Response.json({ message: "Обявата не е намерена." }, { status: 404 });
    }
    return Response.json({ sold });
  } catch (error) {
    console.error("Listing's sold mark could not be changed", error);
    return Response.json({ message: "Не успяхме да запазим промяната. Опитай отново." }, { status: 500 });
  }
}

// Marks the owner's listing as sold.
export async function PUT(_request: Request, { params }: RouteContext<"/api/listings/[id]/sold">) {
  return change((await params).id, true);
}

// Puts the owner's listing back on sale.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/listings/[id]/sold">) {
  return change((await params).id, false);
}
