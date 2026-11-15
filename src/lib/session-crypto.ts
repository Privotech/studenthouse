import crypto from "node:crypto";

function getTokenPepper(): string {
  const configured = process.env.AUTH_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  return "naijaplay-dev-session-pepper-configure-auth-secret-in-prod";
}

/**
 * Computes a keyed HMAC-SHA256 digest of a raw bearer/cookie session token.
 * Only this digest is persisted in PostgreSQL np_sessions, protecting active sessions
 * even if the database is read or dumped.
 */
export function hashSessionToken(rawToken: string): string {
  return crypto
    .createHmac("sha256", getTokenPepper())
    .update(rawToken.trim(), "utf8")
    .digest("hex");
}
