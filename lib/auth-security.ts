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

export function evaluatePasswordStrength(password: string): PasswordScore {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const criteria = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol];
  const passedCount = criteria.filter(Boolean).length;

  const feedback: string[] = [];
  if (!hasMinLength) feedback.push("Minimum 8 characters required");
  if (!hasUppercase) feedback.push("Add at least one uppercase letter (A-Z)");
  if (!hasLowercase) feedback.push("Add at least one lowercase letter (a-z)");
  if (!hasNumber) feedback.push("Add at least one numeric digit (0-9)");
  if (!hasSymbol) feedback.push("Add at least one special character (!@#$%^&*)");

  let label: PasswordScore["label"] = "Weak";
  let score = 0;

  if (passedCount <= 2) {
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
    isValid: hasMinLength && hasLowercase && (hasUppercase || hasNumber || hasSymbol),
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
 * Rate Limiter and Brute-Force Shield (Sliding Window)
 * Prevents credential stuffing and automated password cracking.
 */
interface RateLimitRecord {
  attempts: number[];
  lockedUntil: number | null;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
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
  const validAttempts = record.attempts.filter((ts) => now - ts < WINDOW_MS);
  record.attempts = validAttempts;
  record.lockedUntil = null;

  if (validAttempts.length >= MAX_ATTEMPTS) {
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
    remainingAttempts: MAX_ATTEMPTS - validAttempts.length,
  };
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { attempts: [], lockedUntil: null };
  record.attempts.push(now);

  if (record.attempts.length >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
  }

  rateLimitStore.set(identifier, record);
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
