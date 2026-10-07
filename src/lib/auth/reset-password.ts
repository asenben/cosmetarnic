import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { sql } from "@/lib/db";

export type ResetPasswordResult =
  | { ok: true }
  // `field` is set when the problem is with one of the two password fields rather than the link.
  | { ok: false; field?: "password" | "password_confirm"; message: string };

const INVALID_LINK = "Връзката е невалидна или изтекла. Поискай нова от „Забравена парола“.";

export async function resetPassword(input: Record<string, unknown>): Promise<ResetPasswordResult> {
  const token = typeof input.token === "string" ? input.token : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!token) return { ok: false, message: INVALID_LINK };

  // Checked before the link is used up, so a typo in the new password doesn't cost the visitor the link.
  const problem = passwordProblem(password, input.password_confirm);
  if (problem) return { ok: false, ...problem };

  const passwordHash = await hashPassword(password);
  // Deleting the row is what claims the link: it works once, even if opened twice at the same moment.
  const [reset] = await sql`
    delete from password_resets
    where token_hash = ${hashToken(token)} and expires_at > now()
    returning user_id
  `;
  if (!reset) return { ok: false, message: INVALID_LINK };

  // The link came through the account's inbox, which also confirms the email address.
  await sql`
    update users
    set password_hash = ${passwordHash}, email_verified_at = coalesce(email_verified_at, now())
    where id = ${reset.user_id}
  `;
  // Whoever knew the old password is signed out everywhere, and any other reset links stop working.
  await sql`delete from sessions where user_id = ${reset.user_id}`;
  await sql`delete from password_resets where user_id = ${reset.user_id}`;
  return { ok: true };
}
