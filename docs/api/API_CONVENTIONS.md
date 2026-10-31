# NaijaPlay — API Conventions & Contract Standards

**Document Version:** 1.0 (Phase 1 Foundation)  
**Base Path:** `/api/v1/*`  
**Transport Format:** HTTPS JSON (`application/json; charset=utf-8`)  
**Validation Library:** Zod (`@naijaplay/validation`)

---

## 1. Standardized Response Envelope

Every NaijaPlay API endpoint returns a deterministic `ApiResponse<T>` JSON envelope defined in `@naijaplay/shared`. This allows both the Next.js PWA and the future Android application to share a single HTTP client parser.

### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "computedAgeZone": "JUNIOR",
    "computedAgeYears": 10
  },
  "error": null,
  "meta": {
    "requestId": "req_m9x8k2_8f91a",
    "timestamp": "2026-10-31T06:00:00.000Z",
    "version": "v1"
  }
}
```

### Error Response (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GUARDIAN_CONSENT_REQUIRED",
    "message": "Active parental/guardian consent is required for JUNIOR Zone players before performing 'tournament:enter'.",
    "fieldErrors": {}
  },
  "meta": {
    "requestId": "req_m9x8k5_3b21c",
    "timestamp": "2026-10-31T06:00:02.000Z",
    "version": "v1"
  }
}
```

---

## 2. Canonical Error Codes (`ErrorCode`)

| Error Code | HTTP Status | Meaning |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | `400` | Request body or query parameters failed Zod schema validation (`fieldErrors` populated). |
| `AUTHENTICATION_REQUIRED` | `401` | Missing or expired session token. |
| `FORBIDDEN_ROLE` | `403` | Authenticated user's `UserRole` or resource ownership does not permit the action. |
| `AGE_ZONE_RESTRICTED` | `403` / `422` | Player's server-computed `AgeZone` is outside the allowed range for the target activity. |
| `GUARDIAN_CONSENT_REQUIRED` | `403` | Minor (`JUNIOR` or `TEEN`) lacks an active, non-revoked `GuardianConsent` scope. |
| `GUARDIAN_SELF_GRANT_FORBIDDEN` | `403` | Attempt by a non-guardian or minor to self-grant parental consent. |
| `MINOR_MESSAGING_PROHIBITED` | `403` | Attempt to invoke direct private messaging (prohibited platform-wide for child safety). |
| `ACCOUNT_NOT_ACTIVE` | `403` | Account is `PENDING_GUARDIAN_CONSENT`, `RESTRICTED`, `SUSPENDED`, or `DEACTIVATED`. |
| `DUPLICATE_REWARD_CLAIM` | `409` | Idempotency key or `[missionId, playerProfileId, periodKey]` has already been credited. |
| `DUPLICATE_TOURNAMENT_ENTRY` | `409` | Player is already registered for the specified `tournamentId`. |
| `IMMUTABLE_LEDGER_VIOLATION` | `403` / `409` | Attempt to directly mutate XP balances or record a non-positive ledger entry. |
| `SCORE_PLAUSIBILITY_REJECTED` | `422` | Submitted game score or session duration failed server-side anti-cheat plausibility checks. |
| `RATE_LIMIT_EXCEEDED` | `429` | Client exceeded sliding-window rate limits. |

---

## 3. Route Handler Design Rules

1. **Thin Route Handlers:** Route handlers in `app/api/v1/*/route.ts` must never exceed ~60 lines. They parse the request, invoke `validateWithSchema()`, call the domain package (`@naijaplay/permissions`, `@naijaplay/game-engine`, `@naijaplay/database`), and return `createSuccessResponse()` or `createErrorResponse()`.
2. **Idempotency Keys:** All state-mutating progression endpoints (score submission, mission completion, tournament entry) require a client-generated `idempotencyKey` (`16–128` chars) enforced at the database unique-constraint level.
3. **Never Trust Client Identity Fields:** In production endpoints, `userId`, `role`, `dateOfBirth`, and `ageZone` are loaded from the authenticated server session and database record—never accepted as authoritative from the JSON body.
