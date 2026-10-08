import { cookies } from "next/headers";
import { cache } from "react";
import { avatarUrl } from "@/lib/auth/avatar";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { sql } from "@/lib/db";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  // The URL of the profile picture, or null while the account has none.
  avatar: string | null;
};

export const SESSION_COOKIE = "session";
const COOKIE_NAME = SESSION_COOKIE;
const DAY_SECONDS = 60 * 60 * 24;
// "Remember me" keeps the session for a month; otherwise it ends with the browser, or after a day.
const REMEMBERED_DAYS = 30;

// `userAgent` is the browser's User-Agent header, kept so the user can recognise the device later.
export async function createSession(userId: string, remember: boolean, userAgent: string | null) {
  const token = newToken();
  const lifetime = (remember ? REMEMBERED_DAYS : 1) * DAY_SECONDS;

  await sql`
    insert into sessions (token_hash, user_id, user_agent, expires_at)
    values (
      ${hashToken(token)}, ${userId}, ${userAgent?.slice(0, 500) ?? null},
      now() + (${lifetime}::int * interval '1 second')
    )
  `;

  const cookieStore = await cookies();
  // Signing in again from a browser that is still signed in replaces its session instead of
  // leaving the old one behind in the list of active sessions.
  const previous = cookieStore.get(COOKIE_NAME)?.value;
  if (previous) await sql`delete from sessions where token_hash = ${hashToken(previous)}`;
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
    select users.id, users.username, users.email, users.role, users.avatar
    from sessions
    join users on users.id = sessions.user_id
    where sessions.token_hash = ${hashToken(token)} and sessions.expires_at > now()
  `;
  if (!user) return null;
  return { id: user.id, username: user.username, email: user.email, role: user.role, avatar: avatarUrl(user.avatar) };
});

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  await sql`delete from sessions where token_hash = ${hashToken(token)}`;
  cookieStore.delete(COOKIE_NAME);
}