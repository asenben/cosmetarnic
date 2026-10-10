import { getCurrentUser } from "@/lib/auth/session";
import { createReport } from "@/lib/reports";

// Sends a report about a listing to the administrator, from the "Докладвай" button on its page.
export async function POST(request: Request, { params }: RouteContext<"/api/listings/[id]/report">) {
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
    const result = await createReport(user.id, (await params).id, body as Record<string, unknown>);
    if (!result.ok) return Response.json({ message: result.message }, { status: result.status });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Report could not be saved", error);
    return Response.json({ message: "Не успяхме да изпратим сигнала. Опитай отново." }, { status: 500 });
  }
}
