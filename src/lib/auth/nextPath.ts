// Where an emailed link asks to be taken once the visitor is signed in, e.g. the email about a
// new message opens /?next=/profile/messages/<id>. Signed in, the visitor is sent there at once;
// signed out, the sign-in form opens first and leads there afterwards (see AuthProvider).
export const NEXT_PARAM = "next";

// Only an address on this site is followed, never one that would lead elsewhere ("//other.com").
export const safeNextPath = (value: unknown) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : null;
