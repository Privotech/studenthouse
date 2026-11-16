# NaijaPlay Ecosystem

**One connected platform. Three experiences. Shared progress.**

The NaijaPlay Ecosystem brings three complementary products together
under one platform:

1.  **NaijaPlay** --- games, entertainment and healthy competition.
2.  **SkillQuest** --- structured learning and skills development.
3.  **Talent Arena** --- talent portfolios, discovery and competitions.

The ecosystem is designed for an initial Nigerian launch, with the
ability to expand into other African markets after product validation
and regulatory review.

## 1. Vision

Create a connected digital environment where young people can play,
learn, practise skills, showcase their abilities and participate in
positive competition.

Each product has a clear purpose and user experience, while shared
platform services reduce duplication and allow users to move between
experiences securely.

## 2. The three experiences

### NaijaPlay --- Play. Learn. Compete. Become.

A gaming and entertainment experience featuring: - Naija Trivia. - Brain
Rush. - Word Challenge. - Math Rush. - Memory Match. - Game sessions and
verified scores. - XP, levels, badges and achievements. - Daily and
weekly challenges. - Age-appropriate leaderboards and tournaments. -
Moderated clubs and creative activities.

### SkillQuest --- Learn. Practise. Build. Grow.

A learning experience featuring: - Course catalogue and learning
paths. - Lessons and learning resources. - Quizzes and assessments. -
Practical projects and assignments. - Learner progress and milestones. -
Instructor and course-author tools. - School and class management. -
Completion records and certificates with transparent criteria.

### Talent Arena --- Discover. Showcase. Compete. Get recognised.

A talent and competition experience featuring: - Talent profiles and
portfolios. - Creative and technical categories. - Media and project
submissions. - Competition creation and registration. - Judges, scoring
rubrics and feedback. - Results, finalists and certificates. - School
and organisation competitions. - Approved showcases and sponsored
challenges.

## 3. Shared account and platform services

The ecosystem should provide one secure account while preserving each
product's permissions and data boundaries.

Shared capabilities: - Identity and authentication. - Age-aware
onboarding and guardian consent. - User profile and account settings. -
Role and permission management. - School and organisation memberships. -
Subscription plans and entitlements. - Payment records and verified
webhooks. - Notifications and communication preferences. - Search and
discovery services. - XP and achievement infrastructure where
appropriate. - Moderation and reporting. - Audit logging. - Support and
help centre. - Analytics and operational monitoring. - Localization and
accessibility.

A shared account does not mean every product can read every record. Each
module must enforce its own resource permissions.

## 4. User groups and roles

Potential account roles include: - Junior, teen and adult
participants. - Parent or guardian. - Learner. - Instructor or course
author. - Teacher. - School administrator. - Talent participant. -
Competition organiser. - Judge. - Sponsor or partner organisation. -
Moderator. - Platform administrator.

Use role assignments scoped to the relevant organisation, class, course,
competition or resource. Avoid a single global role that grants
excessive access.

## 5. Multi-tenant business model

The platform should support individuals and multiple independent
organisations.

Examples: - School A manages its own students, classes, teachers and
competitions. - School B manages a separate set of records. - An academy
manages its own learners and courses. - An organisation runs a private
challenge. - A sponsor manages only its approved campaign information.

Tenant isolation is mandatory. Users must not be able to access another
organisation's private data by guessing or changing identifiers.

Recommended core concepts: - Organization - OrganizationMembership -
OrganizationRole - School - Class or Group - CourseEnrollment -
Competition - ProductEntitlement - Subscription

Not every entity must be added immediately. Model the actual release
scope and evolve through reviewed migrations.

## 6. Commercial model

Potential revenue streams:

### Individual

-   Free tier with defined limits.
-   Optional premium membership.
-   Paid adult learning or creator tools where appropriate.
-   Transparent subscription renewals and cancellation.

### Schools and academies

-   Per-student or institution-wide licences.
-   Teacher and administrator dashboards.
-   School competitions.
-   Learning and participation reports.

### Organisations and NGOs

-   Sponsored learning programmes.
-   Youth engagement programmes.
-   Private competitions and challenges.
-   Programme outcome reports.

### Brands and sponsors

-   Sponsored competitions.
-   Branded learning quests.
-   Approved events and campaigns.
-   Clearly disclosed sponsorship placements.

Commercial design must not exploit minors. Do not use behavioural
advertising to children, sell learner data, or make paid purchases
determine competition outcomes. XP must remain non-transferable and
non-cashable.

## 7. Architecture

### Recommended approach

Start with a modular monolith in a monorepo. Do not split the products
into independent microservices before there is a demonstrated
operational need.

Technology direction: - Next.js App Router. - TypeScript strict mode. -
Tailwind CSS and a shared UI component library. - PostgreSQL. - Prisma
ORM. - Auth.js. - Zod. - pnpm workspaces and Turborepo. - Phaser.js for
suitable browser games. - PWA capabilities. - Managed object storage
compatible with S3. - Vercel for the web application. - Neon or another
managed PostgreSQL provider.

Potential later additions: - Redis for caching and rate limiting. -
Background job workers for notifications, media processing and
reports. - Persistent realtime service for multiplayer and live
events. - Search infrastructure if database search becomes insufficient.

### Suggested monorepo structure

``` text
naijaplay-ecosystem/
├── apps/
│   └── web/
│       └── src/
│           ├── app/
│           ├── components/
│           ├── modules/
│           │   ├── identity/
│           │   ├── naijaplay/
│           │   ├── skillquest/
│           │   ├── talent-arena/
│           │   ├── organizations/
│           │   ├── subscriptions/
│           │   ├── notifications/
│           │   ├── moderation/
│           │   └── administration/
│           └── lib/
├── packages/
│   ├── database/
│   ├── validation/
│   ├── permissions/
│   ├── ui/
│   └── shared/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── database/
│   ├── security/
│   └── operations/
├── tooling/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

This is a target structure, not a requirement to create empty packages.
Keep code where it has a clear owner and reason to exist.

## 8. Multi-user safety and concurrency

The system must work correctly when many users perform actions at the
same time.

### Identity and ownership

-   Give each account a unique immutable ID.
-   Derive the user ID from the verified server session.
-   Never trust client-provided ownership or tenant identifiers.
-   Check authorization for every read, write, update, delete and
    export.

### Tenant isolation

-   Scope organisation-owned data to the correct tenant.
-   Enforce tenant membership and resource permissions server-side.
-   Consider PostgreSQL Row-Level Security as defence in depth.
-   Test cross-tenant access attempts for every module.

### Concurrency and consistency

-   Use database transactions for multi-record operations.
-   Use atomic increments for XP and counters.
-   Add unique constraints for one-time rewards and registrations.
-   Use idempotency keys for payments, webhooks and retried operations.
-   Use optimistic concurrency/version checks for simultaneous edits.
-   Preserve assessment attempts and judging history.
-   Never store user-specific mutable state in global server variables.

### Performance

-   Use database connection pooling.
-   Add indexes based on real query patterns.
-   Paginate large lists and reports.
-   Avoid N+1 queries.
-   Apply rate limits and request timeouts.
-   Cache only data that is safe to cache, with user- and tenant-aware
    keys.
-   Move heavy processing to background jobs.
-   Use object storage for media instead of storing large files in
    PostgreSQL.

## 9. Security, privacy and safeguarding

-   Apply data minimisation and privacy by default.
-   Separate private identity records from public profile data.
-   Use secure sessions and appropriate account recovery.
-   Enforce server-side authorization.
-   Validate inputs and uploaded files.
-   Protect against account takeover, injection, abuse and privilege
    escalation.
-   Maintain audit logs for sensitive administrative actions.
-   Implement reporting, moderation, appeals and incident response.
-   Provide age-appropriate experiences and guardian consent where
    required.
-   Do not expose minors' precise location or private contact details.
-   Do not provide unrestricted direct messaging to minors.
-   Avoid behavioural advertising to children.
-   Establish retention, deletion, backup and recovery procedures.
-   Review Nigerian data protection and child-protection obligations
    before public launch, and repeat the review for each new country.

## 10. Payments and subscriptions

The shared billing layer should support: - Product and plan catalogue. -
Individual and institutional subscriptions. - Feature entitlements. -
Payment initiation and verification. - Signed webhook validation. -
Idempotent event processing. - Receipts and billing history. - Renewals,
cancellations and refunds. - Administrative billing support.

Keep payment provider logic behind a well-defined integration boundary.
Do not trust a browser success redirect as proof of payment. Verify
payment server-side with the provider.

## 11. Admin and operations

Provide role-appropriate administration for: - Users and
organisations. - Games and game content. - Courses and learning
content. - Talent categories and portfolios. - Competitions and
judging. - Subscriptions and entitlements. - Reports and moderation
actions. - Audit events. - Platform health and analytics.

Administrative access should be protected with least privilege, strong
authentication and auditable actions.

## 12. Suggested MVP and release strategy

### Release 1 --- Shared foundation

-   Identity and authentication.
-   User profiles and age-aware onboarding.
-   Permissions and organisation boundaries.
-   Database and audit foundations.
-   Shared design system and navigation.

### Release 2 --- NaijaPlay

-   Two initial games for validation.
-   Game sessions and server-verified scoring.
-   XP and missions.
-   Basic safe leaderboard.

### Release 3 --- SkillQuest

-   Course catalogue.
-   Lessons and quizzes.
-   Progress tracking.
-   Basic instructor content management.

### Release 4 --- Talent Arena

-   Talent profiles.
-   Portfolio submissions.
-   Moderated competition registration.
-   Judges and structured results.

### Release 5 --- Commercial readiness

-   Plans and entitlements.
-   Payment integration.
-   School and organisation licensing.
-   Billing support and reports.

### Release 6 --- Scale and launch

-   Load and security testing.
-   Monitoring and incident response.
-   Backup restoration tests.
-   Pilot schools and youth organisations.
-   Nigeria launch and measured expansion.

## 13. Testing strategy

Test at unit, integration, end-to-end and load levels.

Required scenarios: - Two users using different modules
simultaneously. - User A cannot access User B's private records. -
School A cannot access School B's records. - Learner cannot access
instructor or admin actions. - Duplicate mission completion does not
award XP twice. - Simultaneous XP awards do not lose updates. -
Duplicate competition registrations are rejected safely. - Concurrent
judge edits do not silently overwrite each other. - Repeated payment
webhooks do not create duplicate payments or entitlements. - Revoked
guardian consent changes the applicable access. - Upload and moderation
failures are handled safely.

Run load tests at increasing concurrency levels, such as 50, 100, 500
and 1,000 simulated users. These are test stages, not promises of
capacity. Record latency, error rates, database connection use and
bottlenecks.

## 14. Success metrics

Shared: - Active users and retention. - Crash-free sessions and API
reliability. - Support response time. - Security and moderation
incidents. - Subscription conversion and renewal. - School and
organisation retention.

NaijaPlay: - Games played, challenge completion and repeat
participation.

SkillQuest: - Course and lesson completion, assessment progress and
learning-path progression.

Talent Arena: - Portfolio completion, submissions, competition
participation and repeat entries.

## 15. Project governance

-   Maintain product-specific requirements and roadmaps.
-   Keep shared services documented.
-   Record architecture decisions.
-   Use reviewed database migrations.
-   Require tests for permission and concurrency changes.
-   Maintain separate development, preview and production environments.
-   Keep secrets out of source control.
-   Review child-safety and privacy impact when introducing new
    features.
-   Do not describe unimplemented functionality as production-ready.

## 16. Project status and licensing

This document defines the intended ecosystem and target architecture. It
is not evidence that all modules, integrations, security controls or
scale targets are already implemented.

Choose a software licence before distributing source code. Product
source-code rights, brand rights, course content, user submissions and
media rights may have different ownership and licensing terms.
