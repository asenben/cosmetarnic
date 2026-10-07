import { sendVerificationEmail } from "@/lib/auth/emailVerification";
import { hashPassword } from "@/lib/auth/password";
import { sql } from "@/lib/db";

export type RegisterField = "username" | "email" | "password" | "password_confirm" | "terms";
export type RegisterErrors = Partial<Record<RegisterField, string>>;

export type RegisterResult =
  // `emailSent` is false when the account was created but the confirmation email could not go out.
  | { ok: true; user: { id: string; username: string; email: string }; emailSent: boolean }
  | { ok: false; errors: RegisterErrors };

const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{3,30}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
// scrypt accepts any length; the cap only stops someone from making the server hash megabytes.
const PASSWORD_MAX = 200;

const text = (value: unknown) => (typeof value === "string" ? value : "");

function validate(input: Record<string, unknown>) {
  const username = text(input.username).trim();
  const email = text(input.email).trim().toLowerCase();
  const password = text(input.password);
  const errors: RegisterErrors = {};

  if (!USERNAME_PATTERN.test(username)) {
    errors.username = "Потребителското име трябва да е от 3 до 30 знака: букви, цифри, точка, тире или долна черта.";
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "Въведи валиден имейл адрес.";
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors.password = `Паролата трябва да е между ${PASSWORD_MIN} и ${PASSWORD_MAX} знака.`;
  } else if (password !== text(input.password_confirm)) {
    errors.password_confirm = "Паролите не съвпадат.";
  }
  if (input.terms !== true) {
    errors.terms = "Трябва да приемеш правилата и политиката за поверителност.";
  }

  return { username, email, password, errors };
}

const TAKEN: RegisterErrors = {
  username: "Това потребителско име вече е заето.",
  email: "Вече има профил с този имейл.",
};

// `origin` is the site address used for the confirmation link in the email.
export async function registerUser(input: Record<string, unknown>, origin: string): Promise<RegisterResult> {
  const { username, email, password, errors } = validate(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const existing = await sql`
    select lower(username) = lower(${username}) as username_taken, lower(email) = ${email} as email_taken
    from users
    where lower(username) = lower(${username}) or lower(email) = ${email}
  `;
  if (existing.length > 0) {
    const taken: RegisterErrors = {};
    if (existing.some((row) => row.username_taken)) taken.username = TAKEN.username;
    if (existing.some((row) => row.email_taken)) taken.email = TAKEN.email;
    return { ok: false, errors: taken };
  }

  const passwordHash = await hashPassword(password);
  let user: { id: string; username: string; email: string };
  try {
    const [row] = await sql`
      insert into users (username, email, password_hash)
      values (${username}, ${email}, ${passwordHash})
      returning id, username, email
    `;
    user = row as typeof user;
  } catch (error) {
    // Two sign-ups for the same name or email at the same moment: the unique index rejects the second.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      const constraint = "constraint" in error ? String(error.constraint) : "";
      return { ok: false, errors: constraint.includes("email") ? { email: TAKEN.email } : { username: TAKEN.username } };
    }
    throw error;
  }

  // The account exists either way; a failed email can be sent again by trying to sign in.
  try {
    return { ok: true, user, emailSent: await sendVerificationEmail(user, origin) };
  } catch (error) {
    console.error("Verification email failed", error);
    return { ok: true, user, emailSent: false };
  }
}