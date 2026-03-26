# E2E test plan and route matrix

**Purpose:** Traceable coverage for middleware vs App Router pages, plus smoke tests split by **job seeker** vs **recruiter** areas. This is not a line-by-line audit; it is the artifact for “what we assert in automation.”

**Automation:** Playwright (`playwright.config.ts`, `e2e/`). Run `npx playwright install chromium` once. `npm run test:e2e` starts `next dev` on **`PLAYWRIGHT_PORT` (default `3010`)** unless `PLAYWRIGHT_SKIP_WEBSERVER=1` — using **3010** avoids another process on **3000** that is not this app (symptom: `GET /api/user` → **404**). Unauthenticated specs run **serially** in `public-and-api.spec.ts` to reduce dev-server contention during cold compile. **`use.serviceWorkers: "block"`** so `page.route` reliably intercepts `fetch` (service workers can bypass Playwright routing). When stubbing APIs, use a **regex or pathname predicate** that distinguishes `/api/jobs` from `/api/jobs/applied` — a loose glob such as `**/api/jobs` can match the wrong URL and fall through to the real backend.

**CI:** GitHub Actions (`.github/workflows/ci.yml`) runs **`npm run test:e2e`** in a separate job from lint/build. **`~/.cache/ms-playwright`** is cached keyed on `package-lock.json` hash; the job runs `npx playwright install chromium --with-deps` so Chromium and Ubuntu deps are present. Placeholder `NEXT_PUBLIC_SUPABASE_*` env vars match the build job.

| Env | Meaning |
|-----|---------|
| `PLAYWRIGHT_PORT` | Dev server port for `webServer` (default **`3010`** — avoids another app bound to `3000` returning 404 for `/api/*`) |
| `PLAYWRIGHT_BASE_URL` | Override full base URL (default `http://127.0.0.1:<PLAYWRIGHT_PORT>`) |
| `PLAYWRIGHT_SKIP_WEBSERVER` | Do not run `npm run dev` (you must set `PLAYWRIGHT_BASE_URL` to a running app) |
| `E2E_MOCK_AUTH` | Optional legacy flag; **cookie mock auth** in `lib/e2e-auth.ts` is enabled in **non-production** when mock cookies + fixed secret match (see KT). Set in `.env.local` if other code still reads it. |
| `NEXT_PUBLIC_E2E_MOCK_AUTH` | *(Unused in current code; mock auth is cookie + non-production.)* |
| (cookie secret) | Fixed value `E2E_MOCK_DEFAULT_SECRET` in `lib/e2e-auth.ts` — must match Playwright cookies; not configurable per env (Edge bundle cannot rely on server-only secrets). |
| `E2E_JOB_SEEKER_EMAIL` / `E2E_JOB_SEEKER_PASSWORD` | *(Optional)* Real Supabase login — **not** used by default; signed-in specs use **mock auth** instead. |
| `E2E_USER_RECRUITER_EMAIL` / `E2E_USER_RECRUITER_PASSWORD` | *(Optional)* Same — reserved if you add real-login tests later. |

---

## 1. Middleware vs `app/**/page.tsx` (route matrix)

Source of truth for protection: `middleware.ts` (`isProtected` + API exceptions). A page is **protected** if its path prefix matches a protected rule **and** the user is not signed in (then redirect to `/login?next=…` for pages, or `401` for `/api/*` except allowlisted routes).

### 1.1 Protected path prefixes (session required)

| Prefix | Typical pages (examples) |
|--------|---------------------------|
| `/dashboard` | `/dashboard` |
| `/resume-analyzer` | `/resume-analyzer` |
| `/resume-builder` | `/resume-builder` |
| `/job-match` | `/job-match` |
| `/job-finder` | `/job-finder` |
| `/auto-apply` | `/auto-apply` |
| `/smart-apply` | `/smart-apply` |
| `/tailor-resume` | `/tailor-resume` |
| `/cover-letter` | `/cover-letter` |
| `/interview-prep` | `/interview-prep` |
| `/import-linkedin` | `/import-linkedin` |
| `/job-board` | `/job-board` |
| `/applications` | `/applications` |
| `/analytics` | `/analytics` (job seeker analytics) |
| `/activity` | `/activity` |
| `/salary-insights` | `/salary-insights` |
| `/skill-demand` | `/skill-demand` |
| `/resume-performance` | `/resume-performance` |
| `/career-coach` | `/career-coach` |
| `/streak-rewards` | `/streak-rewards` |
| `/onboarding` | `/onboarding` |
| `/select-role` | `/select-role` |
| `/recruiter` | All recruiter UI under `/recruiter/...` |
| `/history` | `/history` |
| `/pricing` | `/pricing` (shared route group) |
| `/settings` | `/settings` |

**Note:** `/api/*` is protected except: `/api/auth/*`, `/api/platform-stats`, `/api/public/*`, `/api/share-result`, `/api/share/*` (see `middleware.ts`).

### 1.2 Public (no session required for navigation)

| Area | Routes |
|------|--------|
| Marketing / landing | `/`, `/demo`, `/contact`, `/create-resume`, `/privacy`, `/terms` |
| Auth | `/login`, `/signup`, `/login/reset` |
| OAuth | `/auth/callback` |
| SEO / public content | `/jobs`, `/jobs/[slug]`, `/salary`, `/salary/[slug]`, `/skills` |
| Share / viral | `/share/[token]`, `/results/[token]` |
| Public profiles | `/u/[slug]` |

### 1.3 Gap check (pages not covered by a prefix above)

If you add a new `app/**/page.tsx` under a route that is **not** listed in §1.1 or §1.2, update `middleware.ts` (or intentionally leave as public).

---

## 2. Smoke tests by area

### 2.1 Always run (no credentials): `e2e/public-and-api.spec.ts`

- `GET /api/user` → `401` + `{ error: "Unauthorized" }`
- Unauthenticated `/dashboard`, `/select-role`, `/recruiter` → redirect to `/login` with `next` matching the path
- `/login` shows Email, Password, Sign in

### 2.2 Job seeker: `e2e/job-seeker.spec.ts`

Uses **`applyE2eMockAuth(context, "job_seeker")`** (cookies + `E2E_MOCK_AUTH` on the server). No real email/password.

- Direct navigation to `/dashboard`, `/job-board`, `/resume-analyzer`, `/applications`, etc. after mock cookies
- `/select-role` shows “Choose Your Role” and Job Seeker / Recruiter buttons

### 2.3 Recruiter: `e2e/recruiter.spec.ts`

Uses **`applyE2eMockAuth(context, "recruiter")`**. No real email/password.

- `/recruiter` shows heading **Recruiter Dashboard**
- Deeper flows stub JSON APIs in the spec where needed (no reliance on live DB rows)

**Skipping `webServer`:** If `PLAYWRIGHT_SKIP_WEBSERVER=1`, start `next dev` yourself in **non-production** with the same `PLAYWRIGHT_BASE_URL` / port; ensure mock cookies from `e2e/e2e-mock-auth.ts` use `E2E_MOCK_DEFAULT_SECRET` (or protected routes may redirect to `/login`).

---

## 3. Next iteration: deeper coverage (manual checklist)

Expand one area at a time:

- **Job seeker:** resume analyzer upload, job board filters, applications list, pricing (read-only)
- **Recruiter:** jobs CRUD, `/recruiter/jobs/[id]`, pipeline Kanban, candidates list

Record new cases in this doc under §2 with linked spec files when automated.

---

**Last updated:** 2026-03-26 (GitHub Actions E2E job + Playwright browser cache; mock auth via `lib/e2e-auth.ts` + `e2e/e2e-mock-auth.ts`)
