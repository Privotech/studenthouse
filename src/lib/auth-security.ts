import crypto from "crypto";

/**
 * NaijaPlay Authentication Security Engine
 * - PBKDF2-HMAC-SHA256 password hashing with cryptographic salt
 * - Timing-safe constant-time hash comparisons
 * - Rate limiting & brute-force attack prevention (sliding window)
 * - Password complexity analysis and scoring
 * - Cryptographically random session tokens
 */

export interface PasswordScore {
  score: number; // 0 to 4
  label: "Weak" | "Fair" | "Good" | "Strong" | "Excellent";
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isValid: boolean;
  feedback: string[];
}

const COMMON_WEAK_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "naijaplay123",
  "admin1234",
  "letmein123",
  "welcome123",
]);

export function evaluatePasswordStrength(password: string): PasswordScore {
  const hasMinLength = password.length >= 8 && password.length <= 128;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isCommonPassword = COMMON_WEAK_PASSWORDS.has(password.toLowerCase());

  const criteria = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol];
  const passedCount = criteria.filter(Boolean).length;

  const feedback: string[] = [];
  if (password.length < 8) feedback.push("Minimum 8 characters required");
  if (password.length > 128) feedback.push("Maximum 128 characters allowed");
  if (!hasUppercase) feedback.push("Add at least one uppercase letter (A-Z)");
  if (!hasLowercase) feedback.push("Add at least one lowercase letter (a-z)");
  if (!hasNumber) feedback.push("Add at least one numeric digit (0-9)");
  if (!hasSymbol) feedback.push("Add at least one special character (!@#$%^&*)");
  if (isCommonPassword) feedback.push("Avoid commonly guessed passwords");

  let label: PasswordScore["label"] = "Weak";
  let score = 0;

  if (isCommonPassword || passedCount <= 2) {
    score = 1;
    label = "Weak";
  } else if (passedCount === 3) {
    score = 2;
    label = "Fair";
  } else if (passedCount === 4) {
    score = 3;
    label = "Good";
  } else if (passedCount === 5 && password.length < 12) {
    score = 3;
    label = "Strong";
  } else if (passedCount === 5 && password.length >= 12) {
    score = 4;
    label = "Excellent";
  }

  return {
    score,
    label,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    isValid:
      !isCommonPassword &&
      hasMinLength &&
      hasLowercase &&
      hasUppercase &&
      (hasNumber || hasSymbol),
    feedback,
  };
}

/**
 * Generate 16 bytes of cryptographically random hex salt
 */
export function generateSalt(byteLength = 16): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

/**
 * Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations
 */
export async function hashPassword(
  password: string,
  saltHex?: string,
  iterations = 100000
): Promise<{ hash: string; salt: string; iterations: number }> {
  const salt = saltHex || generateSalt();

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      64,
      "sha256",
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve({
          hash: derivedKey.toString("hex"),
          salt,
          iterations,
        });
      }
    );
  });
}

/**
 * Verify a password against stored salt and hash using timing-safe buffer comparison
 */
export async function verifyPassword(
  passwordAttempt: string,
  storedHashHex: string,
  saltHex: string,
  iterations = 100000
): Promise<boolean> {
  if (!passwordAttempt || passwordAttempt.length > 128) {
    return false;
  }
  return new Promise((resolve) => {
    crypto.pbkdf2(
      passwordAttempt,
      saltHex,
      iterations,
      64,
      "sha256",
      (err, derivedKey) => {
        if (err) return resolve(false);

        try {
          const attemptBuffer = derivedKey;
          const storedBuffer = Buffer.from(storedHashHex, "hex");

          if (attemptBuffer.length !== storedBuffer.length) {
            return resolve(false);
          }

          // Timing-safe comparison to prevent side-channel timing attacks
          const isMatch = crypto.timingSafeEqual(attemptBuffer, storedBuffer);
          resolve(isMatch);
        } catch {
          resolve(false);
        }
      }
    );
  });
}

/**
 * Generate cryptographically secure session token (64 hex characters)
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Bounded Sliding-Window Rate Limiter & Brute-Force Shield
 * Prevents credential stuffing, automated password cracking, and OOM map-flooding.
 */
interface RateLimitRecord {
  attempts: number[];
  lockedUntil: number | null;
  lastSeen: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout
const MAX_STORE_ENTRIES = 10_000;

function pruneRateLimitStore(now: number, windowMs: number) {
  if (rateLimitStore.size < MAX_STORE_ENTRIES) return;
  for (const [key, entry] of rateLimitStore.entries()) {
    const expiredLock = !entry.lockedUntil || entry.lockedUntil <= now;
    const stale = now - entry.lastSeen > windowMs;
    if (expiredLock && stale) {
      rateLimitStore.delete(key);
    }
  }
  // Hard cap FIFO eviction if still oversized under heavy distributed flood
  if (rateLimitStore.size >= MAX_STORE_ENTRIES) {
    const firstKey = rateLimitStore.keys().next().value;
    if (firstKey) rateLimitStore.delete(firstKey);
  }
}

export function checkRateLimit(
  identifier: string,
  maxAttempts = MAX_ATTEMPTS,
  windowMs = WINDOW_MS,
): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  // Check if actively locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingSeconds: remainingSeconds,
    };
  }

  // Clean old attempts outside sliding window
  const validAttempts = record.attempts.filter((ts) => now - ts < windowMs);
  record.attempts = validAttempts;
  record.lockedUntil = null;
  record.lastSeen = now;

  if (validAttempts.length >= maxAttempts) {
    record.lockedUntil = now + LOCKOUT_MS;
    rateLimitStore.set(identifier, record);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - validAttempts.length,
  };
}

export function recordFailedAttempt(
  identifier: string,
  maxAttempts = MAX_ATTEMPTS,
  windowMs = WINDOW_MS,
): void {
  const now = Date.now();
  pruneRateLimitStore(now, windowMs);
  const record = rateLimitStore.get(identifier) || {
    attempts: [],
    lockedUntil: null,
    lastSeen: now,
  };
  record.attempts = record.attempts.filter((ts) => now - ts < windowMs);
  record.attempts.push(now);
  record.lastSeen = now;

  if (record.attempts.length >= maxAttempts) {
    record.lockedUntil = now + LOCKOUT_MS;
  }

  rateLimitStore.set(identifier, record);
}

/**
 * Convenience sliding-window quota helper for API endpoints (game completions, uploads, etc.).
 */
export function consumeRateQuota(
  identifier: string,
  maxRequests: number,
  windowMs = WINDOW_MS,
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const check = checkRateLimit(identifier, maxRequests, windowMs);
  if (!check.allowed) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: check.lockoutRemainingSeconds,
    };
  }
  recordFailedAttempt(identifier, maxRequests, windowMs);
  return {
    allowed: true,
    remaining: Math.max(0, check.remainingAttempts - 1),
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
