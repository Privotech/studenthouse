# NaijaPlay — Progressive Web App (PWA) & Offline Strategy

**Document Version:** 1.0 (Phase 1 Foundation)  
**Target Environment:** Low-to-mid-range Android devices, Chrome Mobile, iOS Safari, and intermittent 3G/4G Nigerian mobile networks

---

## 1. Web App Manifest & Installability (`app/manifest.ts`)

NaijaPlay uses Next.js App Router's native `app/manifest.ts` alongside compliant icon assets in `public/` to provide zero-dependency browser installability:
- **`id` / `start_url` / `scope`:** `'/'`
- **`name`:** `'NaijaPlay — Play. Learn. Compete. Become.'`
- **`short_name`:** `'NaijaPlay'` (9 characters, complying with the $\le 12$ character mobile launcher rule)
- **`display`:** `'standalone'`
- **`theme_color`:** `'#064E3B'` (Deep Naija Emerald)
- **`background_color`:** `'#090D16'`
- **Icons:**
  - `/pwa-192x192.png` (`192x192`, `image/png`, `purpose: 'any'`)
  - `/pwa-512x512.png` (`512x512`, `image/png`, `purpose: 'any'`)
  - `/pwa-maskable-512x512.png` (`512x512`, `image/png`, `purpose: 'maskable'` with 15% safe-zone margin)
  - `/apple-touch-icon.png` (`180x180`, `image/png` referenced in `app/layout.tsx` metadata for iOS Safari)
- **In-App Install Prompt:** Wired via `usePWAInstall` and `PWAInstallButton` in the top navigation bar, automatically handling `beforeinstallprompt` on Chromium/Android and displaying a step-by-step "Add to Home Screen" guide on iOS Safari.

---

## 2. Service Worker, Caching & Child-Data Safety Rules

Because shared family or school tablets are common in Nigeria, **caching private account or child data in shared browser caches is a critical security risk**. Our caching strategy enforces strict boundaries:

| Resource Category | Caching Strategy | Security & Integrity Rule |
| :--- | :--- | :--- |
| **Static App Shell & Fonts** (`/_next/static/*`, icons, fonts) | `CacheFirst` (Immutable hashed assets) | Safe to cache across sessions; invalidated automatically on new Next.js build hashes. |
| **Public Game Catalogue & Learning Lesson Definitions** | `StaleWhileRevalidate` | Allows low-data browsing of available games and lesson content when connectivity drops. |
| **Authenticated Player Profiles, Guardian Consents & School Rosters** (`/api/v1/profile/*`, `/api/v1/guardian/*`) | `NetworkOnly` (`Cache-Control: no-store, private`) | **NEVER cached in Service Worker or shared CacheStorage.** Prevents a subsequent user on a shared school/family device from viewing a minor's profile or consent data. |
| **Game Score & XP Submissions** (`/api/v1/architecture/verify-xp`) | `NetworkOnly` with Idempotency Key | Never trust unverified offline XP calculations. If a player loses connectivity mid-submission, the client retains the signed session payload in memory/sessionStorage and retries with the same `idempotencyKey` upon reconnection. |

---

## 3. Update Handling & Push Notification Policy

1. **Service Worker Updates:** Uses `skipWaiting: true` and `clientsClaim: true` for static assets, prompting active game sessions only between rounds so an update never interrupts an in-progress quiz or puzzle.
2. **Push Notifications:** Disabled by default for `JUNIOR` (6–12) and `TEEN` (13–17) zones unless explicitly enabled by a linked Guardian. Notifications never include personal names on lock-screen previews.
