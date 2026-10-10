import { getAdmin } from "@/lib/admin";
import { deleteReport, setReportResolved } from "@/lib/reports";

const NOT_FOUND = "Сигналът не е намерен.";

// Marks a report as looked at (`resolved: true`) or as waiting again. Like the panel's pages,
// this does not admit to existing for anybody who is not an administrator.
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/reports/[id]">) {
  if (!(await getAdmin())) return new Response(null, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Невалидна заявка." }, { status: 400 });
  }
  const resolved = typeof body === "object" && body !== null ? (body as Record<string, unknown>).resolved : undefined;
  if (typeof resolved !== "boolean") return Response.json({ message: "Невалидна заявка." }, { status: 400 });

  try {
    if (!(await setReportResolved((await params).id, resolved))) {
      return Response.json({ message: NOT_FOUND }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Report could not be changed", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}

// Removes a report from the list for good.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/reports/[id]">) {
  if (!(await getAdmin())) return new Response(null, { status: 404 });

  try {
    if (!(await deleteReport((await params).id))) return Response.json({ message: NOT_FOUND }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Report could not be deleted", error);
    return Response.json({ message: "Нещо се обърка. Опитай отново след малко." }, { status: 500 });
  }
}
