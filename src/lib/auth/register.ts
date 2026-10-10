import { PHONE_TAKEN, USERNAME_TAKEN, checkFullName, checkPhone, checkUsername, isUniqueViolation, samePhone, text } from "@/lib/auth/accountFields";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: Record<string, unknown>) {
  const username = checkUsername(input.username);
  const fullName = checkFullName(input.full_name);
  const phone = checkPhone(input.phone);
  const email = text(input.email).trim().toLowerCase();
  const password = text(input.password);
  const errors: RegisterErrors = {};

  if (username.error) errors.username = username.error;
  if (fullName.error) errors.full_name = fullName.error;
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "Въведи валиден имейл адрес.";
  }
  if (phone.error) errors.phone = phone.error;
  const problem = passwordProblem(password, input.password_confirm);
  if (problem) errors[problem.field] = problem.message;
  if (input.terms !== true) {
    errors.terms = "Трябва да приемеш правилата и политиката за поверителност.";
  }

  return { username: username.value, fullName: fullName.value, email, phone: phone.value, password, errors };
}

const TAKEN: RegisterErrors = {
  username: USERNAME_TAKEN,
  email: "Вече има профил с този имейл.",
  phone: PHONE_TAKEN,
};

// `origin` is the site address used for the confirmation link in the email.
export async function registerUser(input: Record<string, unknown>, origin: string): Promise<RegisterResult> {
  const { username, fullName, email, phone, password, errors } = validate(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const existing = await sql`
    select lower(username) = lower(${username}) as username_taken, lower(email) = ${email} as email_taken,
           coalesce(regexp_replace(phone, '^([+]|00)359', '0') = ${samePhone(phone)}, false) as phone_taken
    from users
    where lower(username) = lower(${username}) or lower(email) = ${email}
       or regexp_replace(phone, '^([+]|00)359', '0') = ${samePhone(phone)}
  `;
  if (existing.length > 0) {
    const taken: RegisterErrors = {};
    if (existing.some((row) => row.username_taken)) taken.username = TAKEN.username;
    if (existing.some((row) => row.email_taken)) taken.email = TAKEN.email;
    // One account per phone number, so that nobody registers a second time.
    if (existing.some((row) => row.phone_taken)) taken.phone = TAKEN.phone;
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
    if (isUniqueViolation(error)) {
      const constraint = String(error.constraint ?? "");
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