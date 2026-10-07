import { cookies } from "next/headers";
import { cache } from "react";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { sql } from "@/lib/db";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: string;
};

const COOKIE_NAME = "session";
const DAY_SECONDS = 60 * 60 * 24;
// "Remember me" keeps the session for a month; otherwise it ends with the browser, or after a day.
const REMEMBERED_DAYS = 30;

export async function createSession(userId: string, remember: boolean) {
  const token = newToken();
  const lifetime = (remember ? REMEMBERED_DAYS : 1) * DAY_SECONDS;

  await sql`
    insert into sessions (token_hash, user_id, expires_at)
    values (${hashToken(token)}, ${userId}, now() + (${lifetime}::int * interval '1 second'))
  `;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: lifetime } : {}),
  });
}

// Cached per request, so the layouts and pages that ask for the user share one query.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [user] = await sql`
    select users.id, users.username, users.email, users.role
    from sessions
    join users on users.id = sessions.user_id
    where sessions.token_hash = ${hashToken(token)} and sessions.expires_at > now()
  `;
  return (user as SessionUser | undefined) ?? null;
});

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  await sql`delete from sessions where token_hash = ${hashToken(token)}`;
  cookieStore.delete(COOKIE_NAME);
}