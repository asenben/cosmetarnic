import { verifyEmail } from "@/lib/auth/emailVerification";

// Opened from the link in the confirmation email. Sends the visitor back to the site, where the
// sign-in form opens with the outcome.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  let verified = false;
  try {
    verified = token ? await verifyEmail(token) : false;
  } catch (error) {
    console.error("Email verification failed", error);
  }

  return Response.redirect(new URL(`/?email_verified=${verified ? "1" : "0"}`, process.env.APP_URL ?? url.origin));
}
