import crypto from "node:crypto";
import { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE = "np_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 4 * 60 * 60; // 4 hours

function getConfiguredAdminSecret(): string | null {
  const key = process.env.ADMIN_SECRET_KEY?.trim();
  return key && key.length >= 6 ? key : null;
}

function getHmacSigningKey(): string | null {
  const authSecret = process.env.AUTH_SECRET?.trim();
  const adminKey = getConfiguredAdminSecret();
  if (!adminKey) return null;
  return `${authSecret || "np-local-fallback"}::${adminKey}::xadmin-hmac-v1`;
}

function sha256Buffer(value: string): Buffer {
  return crypto.createHash("sha256").update(value, "utf8").digest();
}

export function isAdminSecretConfigured(): boolean {
  return getConfiguredAdminSecret() !== null;
}

/**
 * Constant-time SHA-256 verification of candidate admin secret key.
 * Fails closed when ADMIN_SECRET_KEY is unset.
 */
export function verifyAdminSecretKey(candidateKey: string | null | undefined): boolean {
  const configured = getConfiguredAdminSecret();
  if (!configured || !candidateKey) return false;
  const normalizedCandidate = candidateKey.trim().toUpperCase();
  const normalizedConfigured = configured.toUpperCase();

  const a = sha256Buffer(normalizedCandidate);
  const b = sha256Buffer(normalizedConfigured);
  return crypto.timingSafeEqual(a, b);
}

/**
 * Mints a signed, time-limited HMAC token stored in HttpOnly np_admin_session cookie
 * so the raw clearance secret key is never stored in cookies or browser storage.
 */
export function issueAdminSessionToken(): string | null {
  const signingKey = getHmacSigningKey();
  if (!signingKey) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const sig = crypto.createHmac("sha256", signingKey).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

const MAX_REVOKED_TOKENS = 2_000;
const revokedAdminTokens = new Map<string, number>();

function pruneRevokedTokens(nowSec: number) {
  for (const [digest, exp] of revokedAdminTokens.entries()) {
    if (exp <= nowSec) {
      revokedAdminTokens.delete(digest);
    }
  }
  while (revokedAdminTokens.size >= MAX_REVOKED_TOKENS) {
    const oldest = revokedAdminTokens.keys().next().value;
    if (!oldest) break;
    revokedAdminTokens.delete(oldest);
  }
}

export function revokeAdminSessionToken(token: string | null | undefined): void {
  if (!token) return;
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0])) return;
  const nowSec = Math.floor(Date.now() / 1000);
  pruneRevokedTokens(nowSec);
  const digest = sha256Buffer(trimmed).toString("hex");
  revokedAdminTokens.set(digest, Number(parts[0]));
}

export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const signingKey = getHmacSigningKey();
  if (!signingKey) return false;

  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3) return false;

  const [expStr, nonce, providedSig] = parts;
  if (!expStr || !nonce || !providedSig) return false;
  if (!/^\d+$/.test(expStr) || !/^[a-f0-9]{32}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(providedSig)) {
    return false;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= nowSec) {
    return false;
  }

  const digest = sha256Buffer(trimmed).toString("hex");
  const revokedExp = revokedAdminTokens.get(digest);
  if (revokedExp && revokedExp > nowSec) {
    return false;
  }

  const payload = `${expStr}.${nonce}`;
  const expectedSig = crypto.createHmac("sha256", signingKey).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(providedSig, "hex"), Buffer.from(expectedSig, "hex"));
}

/**
 * Authorizes an incoming admin API request via HttpOnly signed session cookie or x-admin-key header.
 * Explicitly rejects URL query parameters (?key=...) to prevent secret leakage in logs/history.
 */
export function isAdminRequestAuthorized(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (verifyAdminSessionToken(sessionCookie)) {
    return true;
  }
  const headerKey = req.headers.get("x-admin-key");
  if (headerKey && verifyAdminSecretKey(headerKey)) {
    return true;
  }
  return false;
}
