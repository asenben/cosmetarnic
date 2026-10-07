import { createHash, randomBytes } from "node:crypto";

// For sessions and emailed links. The token itself goes to the browser or the inbox; the database
// keeps only its hash, so a leaked database cannot be used to sign in or to reset a password.
export const newToken = () => randomBytes(32).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
