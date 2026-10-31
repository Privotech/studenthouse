# NaijaPlay — Product Requirements Document (PRD)

**Document Version:** 1.0 (Phase 1 Foundation)  
**Product:** NaijaPlay (*Play. Learn. Compete. Become.*)  
**Initial Market:** Nigeria (`NG`) · **Long-Term Expansion:** Pan-African (`GH`, `KE`, `ZA`)  
**Target Audience:** Ages 6–25 across three distinct, isolated age experiences

---

## 1. Product Vision & Philosophy

NaijaPlay is an African youth digital entertainment and learning ecosystem where children, teenagers, and young adults play lightweight educational and skill games, complete daily missions, participate in fair school and regional tournaments, express creativity, and build verifiable skills.

### Five Non-Negotiable Pillars
1. **Make entertainment enjoyable:** Games must be genuinely fun on low-to-mid-range Android devices and mobile browsers.
2. **Make learning interactive:** Learning progresses like a game with missions, XP, and level unlocks—never a sterile online classroom.
3. **Make competition exciting and fair:** Rankings are earned strictly through verified performance, never pay-to-win mechanics.
4. **Make creativity rewarding:** Moderated creative challenges celebrate African youth art, storytelling, and coding.
5. **Make the platform safe and trustworthy:** Activity-first design with strict child-protection defaults, guardian consent workflows, and zero unrestricted private chat for minors.

---

## 2. Age-Group Segmentation

NaijaPlay enforces three distinct experiences determined server-side from the player's `dateOfBirth`:

| Age Zone | Age Range | Experience & Content Scope | Guardian & Privacy Policy |
| :--- | :--- | :--- | :--- |
| **Junior Zone** | Ages 6–12 | Foundational puzzles, Naija Trivia (Junior), Math Rush, Memory Match, guided creative drawing, basic digital literacy. | Mandatory verified `GuardianConsent` before activation; `PRIVATE_GUARDIAN_ONLY` profile visibility; 60-min default screen-time cap; zero direct messaging. |
| **Teen Zone** | Ages 13–17 | Competitive brain/word/coding games, inter-school tournaments, STEM & financial literacy tracks, moderated school clubs. | Mandatory `GuardianConsent` scopes for tournaments, creative uploads, and clubs; `SCHOOL_AND_CLUB_ONLY` visibility; 120-min default screen-time cap. |
| **Youth Zone** | Ages 18–25 | Advanced national tournaments, coding & entrepreneurship tracks, creative portfolios, community leadership. | Self-managed adult consent; `PUBLIC_OPT_IN` profile visibility; moderated community clubs; eligible for career/skill pathways. |

---

## 3. Product Scope Boundaries (MVP vs. Expansion)

### MVP (Release 1.0 — Priority Modules)
- **Authentication & Age-Aware Onboarding:** Server-side age resolution, guardian consent workflows, and role assignment.
- **Player Profiles:** Avatar selection, XP/level indicator, badge cabinet, and privacy-protective defaults.
- **Game Arena (5 Initial Mini-Games):**
  1. *Naija Trivia* (Nigerian history, geography, culture, general knowledge)
  2. *Brain Rush* (logic, pattern recognition, spatial reasoning)
  3. *Word Challenge* (spelling, vocabulary, word construction)
  4. *Math Rush* (mental arithmetic and speed calculation)
  5. *Memory Match* (working memory and visual recall)
- **XP, Levels & Achievements:** Immutable XP transaction ledger, deterministic level progression, and unlockable badges.
- **Daily & Weekly Missions:** Structured retention goals with idempotent reward claiming.
- **Learn & Grow (Core Missions):** Interactive lessons and quizzes in Mathematics, English, Coding Fundamentals, and Digital Literacy.
- **Leaderboards:** Age-zone isolated and verified score leaderboards.
- **Guardian Consent & Safety Controls:** Consent grant/revocation and screen-time limits.
- **Admin Content & Moderation Queue:** Publishing games/lessons and reviewing flagged reports.

### Version 2 (Post-Validation Expansion)
- School-vs-School competitions and institutional registration portal.
- Asynchronous tournament brackets and automated scheduling.
- Full Parent Dashboard & Teacher Classroom Portal.
- Creative Studio submissions with pre-publication moderation queue.
- Moderated interest clubs (Coding, Science, Football IQ, Literature).

### Version 3 (Long-Term Horizon)
- Dedicated Socket.IO real-time multiplayer service (`apps/realtime`).
- Native Android client consuming shared `@naijaplay/validation` and `/api/v1/*` contracts.
- Multi-country localization (Yoruba, Hausa, Igbo, Swahili, French) and country-specific leagues.

---

## 4. Explicit Prohibitions
- **No Unrestricted Private Messaging:** Children and teens cannot send or receive open direct messages.
- **No Gambling or Cash Betting:** XP is non-transferable and non-cashable. No loot boxes, paid random rewards, or cash wagering.
- **No Behavioral Advertising to Minors:** Zero third-party ad-tracking pixels or behavioral profiling in Junior and Teen zones.
