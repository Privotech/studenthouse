# NaijaPlay — Security, Privacy & Child-Protection Requirements

**Document Version:** 1.0 (Phase 1 Foundation)  
**Regulatory Alignment:** Nigeria Data Protection Act (NDPA) 2023 · NCC Child Online Protection Guidelines

---

## 1. Child-Protection & Age-Aware Security Architecture

NaijaPlay serves children and young adults aged 6–25. Protecting minors (`JUNIOR` ages 6–12 and `TEEN` ages 13–17) is an architectural invariant enforced at the API, permission, and database layers:

1. **Server-Side Age Computation:** Age and `AgeZone` are calculated exclusively on the server (`resolveAuthoritativeAgeZone` in `@naijaplay/validation`) from the immutable `PlayerProfile.dateOfBirth`. Client-supplied `age` or `ageZone` fields are ignored.
2. **Verifiable Guardian Consent (`GuardianConsent`):**
   - Accounts in `JUNIOR` (6–12) and `TEEN` (13–17) zones start in `AccountStatus.PENDING_GUARDIAN_CONSENT`.
   - A verified `GUARDIAN` account (distinct `userId` from the child) must grant explicit `ConsentScope` permissions (`CORE_GAMEPLAY_AND_LEARNING`, `TOURNAMENT_PARTICIPATION`, `CREATIVE_STUDIO_SUBMISSION`, `CLUB_PARTICIPATION`).
   - **Self-Grant Prevention:** `@naijaplay/permissions` explicitly blocks any `PLAYER` role or matching `guardianUserId === childUserId` from granting consent (`ErrorCode.GUARDIAN_SELF_GRANT_FORBIDDEN`).
   - **Immediate Revocation:** When a guardian sets `ConsentStatus.REVOKED` (`revokedAt != null`), subsequent API calls requiring that scope fail immediately with `403 GUARDIAN_CONSENT_REQUIRED`.
3. **Prohibition of Unrestricted Messaging:** Direct user-to-user messaging (`messaging:direct_message`) is blocked at the permission engine level (`ErrorCode.MINOR_MESSAGING_PROHIBITED`). All social features operate through structured, moderated clubs and school challenges.
4. **Privacy-Protective Defaults:**
   - `JUNIOR` profiles default to `PRIVATE_GUARDIAN_ONLY`.
   - `TEEN` profiles default to `SCHOOL_AND_CLUB_ONLY`.
   - Display names are validated to block phone numbers, email addresses, and spaces (`^[a-zA-Z0-9_]{3,20}$`).
   - No precise geolocation is collected or displayed.
5. **Pre-Publication Media Moderation:** All Creative Studio uploads (`CreativeSubmission`) default to `ModerationStatus.PENDING_REVIEW` and are stored in private object storage buckets until explicitly approved by a `MODERATOR`.

---

## 2. Technical Security Controls

### Authentication & Session Management
- Passwords hashed using Argon2id / bcrypt (minimum cost factor 12).
- `HttpOnly`, `Secure`, `SameSite=Lax` session cookies managed via Auth.js.
- Short-lived session tokens with immediate server-side invalidation when `AccountStatus` transitions to `SUSPENDED`, `RESTRICTED`, or `DEACTIVATED`, or when `GuardianConsent` is revoked.

### Input Validation & Injection Prevention
- 100% of API request bodies, query parameters, and route params are validated through strict Zod schemas (`@naijaplay/validation`) prior to hitting domain services.
- Parameterized queries enforced via Prisma ORM; raw SQL queries (`$queryRawUnsafe`) are banned.

### Rate Limiting & Abuse Prevention
- Endpoint-specific rate limits enforced via Redis sliding windows:
  - Authentication & Consent endpoints: `5 requests / minute / IP`
  - Game Score Submission (`/api/v1/games/score`): `12 requests / minute / playerId`
  - Content Reports & Creative Uploads: `5 requests / 10 minutes / playerId`

### Secure File Uploads (Creative Studio)
- Allowlist-only MIME types (`image/png`, `image/jpeg`, `image/webp`) with server-side magic-byte inspection.
- Automatic EXIF metadata stripping (removing GPS coordinates and device serial numbers from children's artwork uploads) before persisting to storage.
- Maximum upload payload size: `2 MB`.

---

## 3. Legal & Compliance Questions for Pre-Launch Counsel Review

Before public pilot launch in Nigeria, legal counsel must review and sign off on:
1. **NDPA Age of Child Threshold:** Under the Nigeria Data Protection Act 2023, any person under 18 is legally a child. Confirm the proportionate verification mechanism required for guardian consent in the Teen Zone (13–17) vs. Junior Zone (6–12).
2. **School Institutional Acting in Loco Parentis:** Determine whether verified Nigerian schools (`School.isVerified = true`) may lawfully provision student accounts for classroom learning missions under institutional agreements, or whether individual parental sign-off is still required before inter-school tournament participation.
3. **Cross-Border Data Residency:** Confirm whether hosting PostgreSQL and media storage in European (`europe-west`) or South African (`af-south-1`) cloud regions satisfies NDPC cross-border data transfer adequacy rules.
4. **Sponsored Educational Prizes:** Verify regulatory boundaries with the National Lottery Regulatory Commission (NLRC) to ensure pure skill-based sponsored school tournaments with educational scholarships/hardware prizes remain exempt from gaming/lottery licensing.
