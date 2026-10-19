import { getCurrentUser } from "@/lib/auth/session";
import { isBot, recordVisit } from "@/lib/stats";

// Counts a page opened in the browser, sent by VisitTracker. Robots and administrators are not
// counted, so the numbers in "Статистика" are of the people the site is for.
export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return new Response(null, { status: 204 });
  if ((await getCurrentUser())?.role === "admin") return new Response(null, { status: 204 });

  const address = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
  try {
    await recordVisit(address, userAgent);
  } catch (error) {
    console.error("Visit could not be counted", error);
  }
  return new Response(null, { status: 204 });
}
