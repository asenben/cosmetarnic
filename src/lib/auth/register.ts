import { sendVerificationEmail } from "@/lib/auth/emailVerification";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { sql } from "@/lib/db";

export type RegisterField =
  | "username"
  | "full_name"
  | "email"
  | "password"
  | "password_confirm"
  | "phone"
  | "terms";
export type RegisterErrors = Partial<Record<RegisterField, string>>;

export type RegisterResult =
  // `emailSent` is false when the account was created but the confirmation email could not go out.
  | { ok: true; user: { id: string; username: string; email: string }; emailSent: boolean }
  | { ok: false; errors: RegisterErrors };

const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{3,30}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A first and a last name: at least two words of letters, with hyphens or apostrophes allowed.
const FULL_NAME_PATTERN = /^[\p{L}'’-]+(\s+[\p{L}'’-]+)+$/u;
// Checked after spaces, dashes and brackets are removed: an optional + and 7 to 15 digits.
const PHONE_PATTERN = /^\+?\d{7,15}$/;

const text = (value: unknown) => (typeof value === "string" ? value : "");

function validate(input: Record<string, unknown>) {
  const username = text(input.username).trim();
  const fullName = text(input.full_name).trim().replace(/\s+/g, " ");
  const email = text(input.email).trim().toLowerCase();
  // Stored without the separators people type, e.g. "0888 123-456" becomes "0888123456".
  const phone = text(input.phone).replace(/[\s().-]/g, "");
  const password = text(input.password);
  const errors: RegisterErrors = {};

  if (!USERNAME_PATTERN.test(username)) {
    errors.username = "Потребителското име трябва да е от 3 до 30 знака: букви, цифри, точка, тире или долна черта.";
  }
  if (fullName.length > 80 || !FULL_NAME_PATTERN.test(fullName)) {
    errors.full_name = "Въведи име и фамилия.";
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "Въведи валиден имейл адрес.";
  }
  if (!PHONE_PATTERN.test(phone)) {
    errors.phone = "Въведи валиден телефонен номер.";
  }
  const problem = passwordProblem(password, input.password_confirm);
  if (problem) errors[problem.field] = problem.message;
  if (input.terms !== true) {
    errors.terms = "Трябва да приемеш правилата и политиката за поверителност.";
  }

  return { username, fullName, email, phone, password, errors };
}

const TAKEN: RegisterErrors = {
  username: "Това потребителско име вече е заето.",
  email: "Вече има профил с този имейл.",
};

// `origin` is the site address used for the confirmation link in the email.
export async function registerUser(input: Record<string, unknown>, origin: string): Promise<RegisterResult> {
  const { username, fullName, email, phone, password, errors } = validate(input);
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
      insert into users (username, full_name, email, phone, password_hash)
      values (${username}, ${fullName}, ${email}, ${phone}, ${passwordHash})
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