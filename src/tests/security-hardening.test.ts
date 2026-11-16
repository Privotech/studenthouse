import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isAdminRequestAuthorized,
  isAdminSecretConfigured,
  issueAdminSessionToken,
  revokeAdminSessionToken,
  verifyAdminSecretKey,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { hashSessionToken } from "@/lib/session-crypto";
import {
  escapeHtml,
  extractClientIp,
  sanitizePlainText,
  sanitizeSafeHttpUrl,
} from "@/lib/input-security";
import { validateMutationOrigin } from "@/middleware";
import { AgeZone } from "@prisma/client";
import {
  consumeRateQuota,
  evaluatePasswordStrength,
  hashPassword,
  resetRateLimit,
  sanitizeUserForClient,
  verifyDummyPassword,
  verifyPassword,
} from "@/lib/auth-security";
import {
  hasUniqueQuestionIds,
  isAgeZoneWithinRange,
  resolveGameMeta,
  resolvePlayerAgeZone,
} from "@/lib/game-session-config";

describe("Security Hardening: Admin Clearance & Signed HMAC Sessions", () => {
  const originalAdminSecret = process.env.ADMIN_SECRET_KEY;
  const originalAuthSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.ADMIN_SECRET_KEY = "TEST_ADMIN_KEY_9944";
    process.env.AUTH_SECRET = "test_auth_secret_key_for_hmac_verification_123456";
  });

  afterEach(() => {
    if (originalAdminSecret === undefined) {
      delete process.env.ADMIN_SECRET_KEY;
    } else {
      process.env.ADMIN_SECRET_KEY = originalAdminSecret;
    }
    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalAuthSecret;
    }
  });

  it("fails closed when ADMIN_SECRET_KEY is unset or too short", () => {
    delete process.env.ADMIN_SECRET_KEY;
    expect(isAdminSecretConfigured()).toBe(false);
    expect(verifyAdminSecretKey("TEST_ADMIN_KEY_9944")).toBe(false);
    expect(issueAdminSessionToken()).toBeNull();

    process.env.ADMIN_SECRET_KEY = "short";
    expect(isAdminSecretConfigured()).toBe(false);
    expect(verifyAdminSecretKey("short")).toBe(false);
  });

  it("verifies candidate admin secret in constant time and rejects invalid keys", () => {
    expect(isAdminSecretConfigured()).toBe(true);
    expect(verifyAdminSecretKey("TEST_ADMIN_KEY_9944")).toBe(true);
    expect(verifyAdminSecretKey("  test_admin_key_9944  ")).toBe(true);
    expect(verifyAdminSecretKey("WRONG_ADMIN_KEY")).toBe(false);
    expect(verifyAdminSecretKey("")).toBe(false);
    expect(verifyAdminSecretKey(null)).toBe(false);
  });

  it("issues and verifies signed HMAC admin tokens and rejects tampering or expiry", () => {
    const token = issueAdminSessionToken();
    expect(token).toBeTruthy();
    expect(token).not.toContain("TEST_ADMIN_KEY_9944");
    expect(verifyAdminSessionToken(token)).toBe(true);

    const parts = token!.split(".");
    expect(parts.length).toBe(3);

    // Tampered signature
    const tamperedSig = `${parts[0]}.${parts[1]}.${"a".repeat(64)}`;
    expect(verifyAdminSessionToken(tamperedSig)).toBe(false);

    // Tampered expiration
    const tamperedExp = `${Number(parts[0]) + 100}.${parts[1]}.${parts[2]}`;
    expect(verifyAdminSessionToken(tamperedExp)).toBe(false);

    // Malformed token
    expect(verifyAdminSessionToken("not-a-valid-token")).toBe(false);

    // Revoked token cannot be replayed
    revokeAdminSessionToken(token);
    expect(verifyAdminSessionToken(token)).toBe(false);
  });

  it("rejects ?key= query string auth and accepts signed HttpOnly cookie or x-admin-key header", () => {
    const token = issueAdminSessionToken()!;

    // Query parameter must NEVER authorize admin access
    const queryAttempt = new NextRequest(
      "https://naijaplay.example/api/xadmin/data?key=TEST_ADMIN_KEY_9944",
    );
    expect(isAdminRequestAuthorized(queryAttempt)).toBe(false);

    // Valid signed session cookie authorizes
    const cookieAttempt = new NextRequest("https://naijaplay.example/api/xadmin/data", {
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=${token}`,
      },
    });
    expect(isAdminRequestAuthorized(cookieAttempt)).toBe(true);

    // Valid x-admin-key header authorizes
    const headerAttempt = new NextRequest("https://naijaplay.example/api/xadmin/data", {
      headers: {
        "x-admin-key": "TEST_ADMIN_KEY_9944",
      },
    });
    expect(isAdminRequestAuthorized(headerAttempt)).toBe(true);
  });
});

describe("Security Hardening: Input Sanitization, XSS & URL Safety", () => {
  it("blocks javascript:, data:, vbscript:, whitespace smuggling, and oversized URLs", () => {
    expect(sanitizeSafeHttpUrl("javascript:alert(1)").valid).toBe(false);
    expect(sanitizeSafeHttpUrl("JaVaScRiPt:alert(document.cookie)").valid).toBe(false);
    expect(sanitizeSafeHttpUrl("data:text/html,<script>alert(1)</script>").valid).toBe(false);
    expect(sanitizeSafeHttpUrl("vbscript:msgbox(1)").valid).toBe(false);
    expect(sanitizeSafeHttpUrl("https://evil.com/a b").valid).toBe(false);
    expect(sanitizeSafeHttpUrl(`https://example.com/${"a".repeat(260)}`).valid).toBe(false);
  });

  it("accepts valid https/http URLs and empty optional URLs", () => {
    expect(sanitizeSafeHttpUrl("")).toEqual({ valid: true, value: "" });
    expect(sanitizeSafeHttpUrl(null)).toEqual({ valid: true, value: "" });

    const good = sanitizeSafeHttpUrl("https://github.com/naijaplay/submission-01");
    expect(good.valid).toBe(true);
    expect(good.value).toBe("https://github.com/naijaplay/submission-01");
  });

  it("escapes HTML special characters and strips control chars & angle brackets", () => {
    expect(escapeHtml(`<script>alert("xss" & 'test')</script>`)).toBe(
      "&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;test&#39;)&lt;/script&gt;",
    );
    expect(sanitizePlainText("Hello\u0000 <World>!", 50)).toBe("Hello World!");
  });

  it("extracts valid client IP addresses safely without trusting garbage headers", () => {
    const h1 = new Headers({ "x-forwarded-for": "197.210.55.12, 10.0.0.1" });
    expect(extractClientIp(h1)).toBe("197.210.55.12");

    const hBad = new Headers({ "x-forwarded-for": "<script>alert(1)</script>" });
    expect(extractClientIp(hBad)).toBe("127.0.0.1");
  });
});

describe("Security Hardening: CSRF Mutation Origin Guard", () => {
  it("allows safe GET/HEAD requests and same-origin POST requests", () => {
    const getReq = new NextRequest("https://app.naijaplay.ng/api/auth/me", {
      method: "GET",
      headers: { host: "app.naijaplay.ng", origin: "https://evil.example" },
    });
    expect(validateMutationOrigin(getReq).ok).toBe(true);

    const sameOriginPost = new NextRequest("https://app.naijaplay.ng/api/auth/login", {
      method: "POST",
      headers: {
        host: "app.naijaplay.ng",
        origin: "https://app.naijaplay.ng",
      },
    });
    expect(validateMutationOrigin(sameOriginPost).ok).toBe(true);
  });

  it("blocks cross-origin Origin, cross-origin Referer, and cross-site sec-fetch-site mutations", () => {
    const crossOriginPost = new NextRequest("https://app.naijaplay.ng/api/auth/login", {
      method: "POST",
      headers: {
        host: "app.naijaplay.ng",
        origin: "https://evil.example",
      },
    });
    expect(validateMutationOrigin(crossOriginPost).ok).toBe(false);

    const crossRefererDelete = new NextRequest("https://app.naijaplay.ng/api/safety/block", {
      method: "DELETE",
      headers: {
        host: "app.naijaplay.ng",
        referer: "https://attacker.org/csrf.html",
      },
    });
    expect(validateMutationOrigin(crossRefererDelete).ok).toBe(false);

    const crossSiteFetch = new NextRequest("https://app.naijaplay.ng/api/player/settings", {
      method: "PATCH",
      headers: {
        host: "app.naijaplay.ng",
        "sec-fetch-site": "cross-site",
        cookie: "np_session=abc123",
      },
    });
    expect(validateMutationOrigin(crossSiteFetch).ok).toBe(false);
  });
});

describe("Security Hardening: Session Hashing, Rate Limiting & Password Guard", () => {
  it("hashes session tokens deterministically with HMAC-SHA256 without exposing raw token", () => {
    const rawToken = "a".repeat(64);
    const digest = hashSessionToken(rawToken);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toBe(rawToken);
    expect(hashSessionToken(rawToken)).toBe(digest);
    expect(hashSessionToken(`${rawToken}x`)).not.toBe(digest);
  });

  it("enforces bounded rate limiting via consumeRateQuota", () => {
    const key = "sec_test_quota_user";
    resetRateLimit(key);

    expect(consumeRateQuota(key, 3, 60_000).allowed).toBe(true);
    expect(consumeRateQuota(key, 3, 60_000).allowed).toBe(true);
    expect(consumeRateQuota(key, 3, 60_000).allowed).toBe(true);

    const fourth = consumeRateQuota(key, 3, 60_000);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);

    resetRateLimit(key);
  });

  it("rejects common weak passwords, oversized passwords (>128), and prevents PBKDF2 DoS", async () => {
    expect(evaluatePasswordStrength("Password123").isValid).toBe(false);
    expect(evaluatePasswordStrength("a".repeat(129)).isValid).toBe(false);
    expect(evaluatePasswordStrength("Naija!Quest2026#Safe").isValid).toBe(true);

    const hashed = await hashPassword("Naija!Quest2026#Safe");
    expect(
      await verifyPassword("Naija!Quest2026#Safe", hashed.hash, hashed.salt, hashed.iterations),
    ).toBe(true);
    expect(
      await verifyPassword("WrongPassword1!", hashed.hash, hashed.salt, hashed.iterations),
    ).toBe(false);
    // Reject >128 char attempt immediately without expensive hashing
    expect(
      await verifyPassword("X".repeat(200), hashed.hash, hashed.salt, hashed.iterations),
    ).toBe(false);

    // Dummy password verification completes cleanly without throwing
    await expect(verifyDummyPassword("any-password")).resolves.toBeUndefined();
  });

  it("strips password hashes, salts, iterations, and lockout counters from serialized user objects", () => {
    const clean = sanitizeUserForClient({
      id: "u-1",
      email: "scholar@example.com",
      username: "scholar_1",
      password_hash: "secret_hash",
      salt: "secret_salt",
      iterations: 100000,
      failed_attempts: 4,
      locked_until: "2026-12-01T00:00:00Z",
    });

    expect(clean).toEqual({
      id: "u-1",
      email: "scholar@example.com",
      username: "scholar_1",
    });
    expect("password_hash" in clean).toBe(false);
    expect("salt" in clean).toBe(false);
    expect("iterations" in clean).toBe(false);
    expect("failed_attempts" in clean).toBe(false);
    expect("locked_until" in clean).toBe(false);
  });
});

describe("Security Hardening: AgeZone SENIOR Support & Anti-Cheat Session Config", () => {
  it("recognizes SENIOR as a valid AgeZone and maps core + senior-exclusive modules cleanly", () => {
    expect(resolvePlayerAgeZone("SENIOR")).toBe(AgeZone.SENIOR);
    expect(resolvePlayerAgeZone("INVALID_TIER")).toBeNull();

    const triviaMeta = resolveGameMeta("naija-trivia");
    expect(triviaMeta.minAgeZone).toBe(AgeZone.JUNIOR);
    expect(triviaMeta.maxAgeZone).toBe(AgeZone.SENIOR);
    expect(isAgeZoneWithinRange(AgeZone.SENIOR, triviaMeta.minAgeZone, triviaMeta.maxAgeZone)).toBe(true);

    const seniorMeta = resolveGameMeta("s-system");
    expect(seniorMeta.minAgeZone).toBe(AgeZone.SENIOR);
    expect(seniorMeta.maxAgeZone).toBe(AgeZone.SENIOR);
    expect(isAgeZoneWithinRange(AgeZone.SENIOR, seniorMeta.minAgeZone, seniorMeta.maxAgeZone)).toBe(true);
    expect(isAgeZoneWithinRange(AgeZone.YOUTH, seniorMeta.minAgeZone, seniorMeta.maxAgeZone)).toBe(false);
  });

  it("rejects duplicate question IDs used to replay single easy answers", () => {
    expect(hasUniqueQuestionIds(undefined)).toBe(true);
    expect(hasUniqueQuestionIds(["q1", "q2", "q3"])).toBe(true);
    expect(hasUniqueQuestionIds(["q1", "q2", "q1"])).toBe(false);
  });
});
