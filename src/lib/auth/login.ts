import { avatarUrl } from "@/lib/auth/avatar";
import { resendVerificationEmail } from "@/lib/auth/emailVerification";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "unverified" | "blocked"; message: string };

// One message for both a wrong name and a wrong password, so the form doesn't reveal which accounts exist.
const INVALID = "Грешно потребителско име или парола.";

// Checked when no account matches, so an unknown name takes as long to reject as a wrong password.
let decoyHash: Promise<string> | undefined;

const text = (value: unknown) => (typeof value === "string" ? value : "");

// `origin` is the site address, needed if a new confirmation email has to be sent.
export async function loginUser(input: Record<string, unknown>, origin: string): Promise<LoginResult> {
  const identifier = text(input.username).trim();
  const password = text(input.password);
  if (!identifier || !password) {
    return { ok: false, reason: "invalid", message: "Въведи потребителско име и парола." };
  }

  // The same field accepts the username or the email the account was registered with.
  const [row] = await sql`
    select id, username, email, role, avatar, password_hash, email_verified_at, blocked_at
    from users
    where lower(username) = lower(${identifier}) or lower(email) = lower(${identifier})
    limit 1
  `;

  if (!row) {
    decoyHash ??= hashPassword("decoy");
    await verifyPassword(password, await decoyHash);
    return { ok: false, reason: "invalid", message: INVALID };
  }
  if (!(await verifyPassword(password, row.password_hash))) {
    return { ok: false, reason: "invalid", message: INVALID };
  }

  // Only reached with the right password, so neither of these reveals anything to a stranger.
  if (row.blocked_at) {
    return { ok: false, reason: "blocked", message: "Този профил е блокиран от администратор." };
  }
  if (!row.email_verified_at) {
    let sent = false;
    try {
      sent = await resendVerificationEmail({ id: row.id, username: row.username, email: row.email }, origin);
    } catch (error) {
      console.error("Verification email failed", error);
    }
    return {
      ok: false,
      reason: "unverified",
      message: sent
        ? "Имейлът ти още не е потвърден. Изпратихме ти нова връзка за потвърждение."
        : "Имейлът ти още не е потвърден. Отвори връзката, която ти изпратихме по имейл.",
    };
  }

  return {
    ok: true,
    user: { id: row.id, username: row.username, email: row.email, role: row.role, avatar: avatarUrl(row.avatar) },
  };
}
