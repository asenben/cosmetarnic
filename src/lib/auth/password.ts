import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export const PASSWORD_MIN = 8;
// scrypt accepts any length; the cap only stops someone from making the server hash megabytes.
export const PASSWORD_MAX = 200;

// The rule for choosing a password, shared by sign-up and password reset. Returns what is wrong
// and with which of the two fields, or nothing when the password is fine.
export function passwordProblem(password: string, confirmation: unknown) {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return {
      field: "password" as const,
      message: `Паролата трябва да е между ${PASSWORD_MIN} и ${PASSWORD_MAX} знака.`,
    };
  }
  if (password !== confirmation) {
    return { field: "password_confirm" as const, message: "Паролите не съвпадат." };
  }
}

// Stored as "scrypt:<salt>:<hash>", both hex, so the algorithm can be changed later.
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = (await scryptAsync(password, Buffer.from(salt, "hex"), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
