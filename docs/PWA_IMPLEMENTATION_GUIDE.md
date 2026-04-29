# PWA Implementation Guide

**Last updated:** 2026-04-30

## Objective

Convert the existing Next.js App Router application into a Progressive Web App (PWA) without breaking dynamic AI/API behavior.

Primary goals:

- Installable on mobile devices
- Faster shell/static loading through service worker caching
- App-like standalone experience
- Safe handling of dynamic endpoints (no stale AI/API response caching)

---

## Architecture Decisions

### 1) PWA Plugin

- Integrated `next-pwa` in `next.config.ts`
- Service worker enabled only in production (`NODE_ENV=production`)
- Service worker output:
  - `public/sw.js`
  - scope `/`

### 2) Caching Strategy (Safety First)

Because this app has highly dynamic features (AI generation, messaging, usage, credits), API freshness is more important than aggressive caching.

Runtime policy:

- `/api/*` -> `NetworkOnly`
  - Prevents stale API/AI/auth/usage responses
  - Includes webhook/cron/internal routes (e.g. `/api/webhooks/*`, `/api/internal/*`) which must never be served from cache
- JS/CSS -> `StaleWhileRevalidate`
  - Improves repeat-load speed while updating in background
- Images/Fonts -> `CacheFirst` with expiry
  - Good for static resources
- Documents/pages -> `NetworkFirst`
  - Keeps content fresh with cache fallback if network fails

### 3) Offline Experience

- Added fallback page: `public/offline.html`
- Added global online/offline indicator: `components/pwa/OfflineStatusBanner.tsx`
  - Only rendered client-side (hydration-safe)
  - Warns users when live AI/API data may be stale offline

### 4) Install UX

- Added `components/pwa/InstallAppButton.tsx`
  - Listens for `beforeinstallprompt`
  - Defers install prompt until user clicks button
  - Hides once app is installed or event is unavailable

### 5) Web App Metadata

- Updated root metadata in `app/layout.tsx`:
  - `manifest: "/manifest.json"`
  - `applicationName`
  - `icons` + Apple touch icon
  - Apple web app config
  - `themeColor` in viewport

### 6) Manifest and Icons

- Added `public/manifest.json`
- Added PNG icon set:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
  - `public/icons/icon-512-maskable.png` (for adaptive launcher compatibility)
  - `public/apple-touch-icon.png`

---

## Files Added

- `public/manifest.json`
- `public/offline.html`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-512-maskable.png`
- `public/apple-touch-icon.png`
- `components/pwa/InstallAppButton.tsx`
- `components/pwa/OfflineStatusBanner.tsx`
- `types/next-pwa.d.ts`

## Files Updated

- `next.config.ts`
- `app/layout.tsx`
- `docs/KNOWLEDGE_TRANSFER.md`

---

## Dependency Changes

Installed:

- `next-pwa`

---

## Important Safety Notes

1. **Do not switch `/api/*` to cache-first** unless each endpoint is explicitly audited.
2. **AI endpoints must remain fresh** due to usage credits, enforcement, and generated output correctness.
3. Keep service worker disabled in development to avoid debugging confusion.
4. If installability fails, verify:
   - Manifest URL
   - Icon paths and MIME types
   - HTTPS in deployment (or localhost)
5. **Do not commit generated SW build artifacts** (`public/sw.js`, `public/workbox-*.js`, `public/fallback-*.js`) to avoid hash-churn and environment drift. These are generated at build time.

---

## Validation Performed

### Build Validation

- Ran: `npm run build`
- Result: successful production build with PWA artifacts generated

Expected log indicators:

- `[PWA] Service worker: .../public/sw.js`
- `[PWA] url: /sw.js`
- fallback route mapping to `/offline.html`

### Functional Validation (Recommended Manual Checklist)

1. Open app in production mode (`next start`)
2. Verify install prompt appears (where supported)
3. Verify app installs and opens standalone
4. Verify `/api/*` requests remain network-fresh
5. Toggle network offline and confirm:
   - offline banner appears
   - fallback page is available for navigation failures

---

## Operational Runbook

### Local test commands

```bash
npm run build
npm run start
```

### PWA/Lighthouse audit

- Open Chrome DevTools -> Lighthouse -> PWA category
- Run audit on production build

---

## Rollback Plan

If PWA behavior needs immediate rollback:

1. In `next.config.ts`, set `disable: true` in `next-pwa` options.
2. Redeploy.
3. (Optional) remove install/offline UI components from `app/layout.tsx`.

This keeps app functionality intact while disabling SW behavior.

---

## Future Improvements (Optional)

- Add role-aware install CTA placement (job seeker vs recruiter shell)
- Add version display + “new update available” toast on SW update
- Add richer offline route shell for key static pages
- Add E2E checks for install-prompt visibility and offline banner behavior

---

## Post-Implementation Hardening Applied

- Install CTA is now hidden on public/auth pages (`/`, `/login`, `/signup`, `/terms`, `/privacy`, `/contact`, `/auth/*`) and shown across the rest of app routes so users can install from any in-app feature surface.
- Offline top banner now uses `pointer-events-none` so it does not block navigation controls.
- Generated SW assets are ignored/untracked in git (`.gitignore`).
- Legacy SVG icon variants were removed to keep PNG icons as the single install-source of truth.
