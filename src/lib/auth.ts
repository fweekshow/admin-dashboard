import { createHash } from "crypto";
import { TOKEN_SALT } from "./constants";

/** Generate a SHA-256 token from the admin password (for cookie storage) */
export function generateToken(password: string): string {
  return createHash("sha256")
    .update(password + TOKEN_SALT)
    .digest("hex");
}

/** Verify a token against the admin password */
export function verifyToken(token: string, password: string): boolean {
  return token === generateToken(password);
}
