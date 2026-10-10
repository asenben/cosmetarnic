// The rules for the account details people type in, shared by sign-up and the profile settings.
// Each check tidies the value and says what is wrong with it, if anything.

const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{3,30}$/u;
// A first and a last name: at least two words of letters, with hyphens or apostrophes allowed.
const FULL_NAME_PATTERN = /^[\p{L}'’-]+(\s+[\p{L}'’-]+)+$/u;
// Checked after spaces, dashes and brackets are removed: an optional + and 7 to 15 digits.
const PHONE_PATTERN = /^\+?\d{7,15}$/;

type Checked = { value: string; error?: string };

// The administrator's account is made directly in the database and has no mailbox: everything
// for it happens inside the site. The column cannot be empty, so it holds an address in
// ".invalid", a domain that never exists; such an address is never shown.
export const hasMailbox = (email: string) => !email.toLowerCase().endsWith(".invalid");

export const text = (value: unknown) => (typeof value === "string" ? value : "");

export function checkUsername(input: unknown): Checked {
  const value = text(input).trim();
  return USERNAME_PATTERN.test(value)
    ? { value }
    : {
        value,
        error: "Потребителското име трябва да е от 3 до 30 знака: букви, цифри, точка, тире или долна черта.",
      };
}

export function checkFullName(input: unknown): Checked {
  const value = text(input).trim().replace(/\s+/g, " ");
  return value.length <= 80 && FULL_NAME_PATTERN.test(value) ? { value } : { value, error: "Въведи име и фамилия." };
}

export function checkPhone(input: unknown): Checked {
  // Stored without the separators people type, e.g. "0888 123-456" becomes "0888123456".
  const value = text(input).replace(/[\s().-]/g, "");
  return PHONE_PATTERN.test(value) ? { value } : { value, error: "Въведи валиден телефонен номер." };
}

export const USERNAME_TAKEN = "Това потребителско име вече е заето.";

// True for the database error raised when a unique value, such as a username, is already in use.
export const isUniqueViolation = (error: unknown): error is { code: string; constraint?: string } =>
  typeof error === "object" && error !== null && "code" in error && error.code === "23505";
