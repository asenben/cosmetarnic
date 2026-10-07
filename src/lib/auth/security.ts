import { cookies } from "next/headers";
import { avatarKey } from "@/lib/auth/avatar";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { sql } from "@/lib/db";
import { deleteImage } from "@/lib/storage/deleteImage";

const WRONG_PASSWORD = "Паролата не е вярна.";

// The hash of this browser's session token, to tell the current session from the user's others.
async function currentTokenHash() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

export type SessionInfo = {
  id: string;
  // The browser's User-Agent header at sign-in; sessions from before it was recorded have none.
  userAgent: string | null;
  createdAt: string;
  current: boolean;
};

// The places the account is signed in, with the browser asking listed first.
export async function listSessions(userId: string): Promise<SessionInfo[]> {
  const current = await currentTokenHash();
  const rows = await sql`
    select id, user_agent, created_at, token_hash
    from sessions
    where user_id = ${userId} and expires_at > now()
    order by created_at desc
  `;
  return rows
    .map((row) => ({
      id: row.id as string,
      userAgent: row.user_agent as string | null,
      createdAt: new Date(row.created_at).toISOString(),
      current: row.token_hash === current,
    }))
    .sort((a, b) => Number(b.current) - Number(a.current));
}

// Signs the account out on one device. Returns false when the session is not this user's.
export async function revokeSession(userId: string, sessionId: string) {
  const removed = await sql`delete from sessions where id = ${sessionId} and user_id = ${userId} returning id`;
  return removed.length > 0;
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; field: "current_password" | "password" | "password_confirm"; message: string };

export async function changePassword(userId: string, input: Record<string, unknown>): Promise<ChangePasswordResult> {
  const current = typeof input.current_password === "string" ? input.current_password : "";
  const password = typeof input.password === "string" ? input.password : "";

  const problem = passwordProblem(password, input.password_confirm);
  if (problem) return { ok: false, ...problem };

  const [user] = await sql`select password_hash from users where id = ${userId}`;
  if (!user || !(await verifyPassword(current, user.password_hash))) {
    return { ok: false, field: "current_password", message: WRONG_PASSWORD };
  }

  await sql`update users set password_hash = ${await hashPassword(password)} where id = ${userId}`;
  // Whoever else knew the old password is signed out; this browser stays signed in.
  await sql`delete from sessions where user_id = ${userId} and token_hash is distinct from ${await currentTokenHash()}`;
  await sql`delete from password_resets where user_id = ${userId}`;
  return { ok: true };
}

export type DeleteAccountResult = { ok: true } | { ok: false; message: string };

// Removes the account for good, with everything that belongs to it. Asks for the password again,
// so an unattended signed-in browser is not enough to do it.
export async function deleteAccount(userId: string, input: Record<string, unknown>): Promise<DeleteAccountResult> {
  const password = typeof input.password === "string" ? input.password : "";
  const [user] = await sql`select password_hash, avatar from users where id = ${userId}`;
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { ok: false, message: WRONG_PASSWORD };
  }

  // Sessions, pending email links and reset links go with the user through their foreign keys.
  await sql`delete from users where id = ${userId}`;
  if (user.avatar) {
    try {
      await deleteImage(avatarKey(user.avatar));
    } catch (error) {
      console.error("Avatar of a deleted account could not be removed", error);
    }
  }
  (await cookies()).delete(SESSION_COOKIE);
  return { ok: true };
}
