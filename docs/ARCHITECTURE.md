# AI Job Assistant – Project Architecture

## 1. System Overview

AI Job Assistant is a SaaS application that helps software developers (0–5 years experience) improve resumes, match jobs, generate cover letters, and prepare for interviews using AI.

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel (Hosting)                          │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App (App Router)                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Frontend  │  │  API Routes │  │  Server Components /     │  │
│  │   (React)   │  │  /api/*     │  │  Client Components      │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Auth       │  │  PostgreSQL  │  │  Storage (resumes)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  OpenAI API / Anthropic Claude (AI features)                     │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Data Flow

- **Auth**: Supabase Auth → session in client → API routes validate via `getUser()`.
- **Resume upload**: Client → API route → Supabase Storage + parse (pdf-parse/mammoth) → `resumes` table.
- **AI features**: Client → API route → check usage → call OpenAI → persist result (where applicable) → return JSON.

## 4. Module Boundaries

| Module            | Responsibility                    | Key files                          |
|-------------------|------------------------------------|------------------------------------|
| Auth              | Sign up, login, logout, reset PW   | `lib/supabase.ts`, auth pages      |
| Users             | Plan, profile in DB                | `users` table, `lib/auth.ts`       |
| Resumes           | Upload, parse, store               | `resumes` table, upload API, utils |
| Resume Analysis   | ATS score, strengths, suggestions | `/api/analyze-resume`, `resume_analysis` |
| Improve Resume    | Rewrite bullet points              | `/api/improve-resume`              |
| Job Match         | Score, missing skills, keywords    | `/api/job-match`, `job_matches`    |
| Cover Letter      | Generate from resume + JD          | `/api/generate-cover-letter`       |
| Interview Prep    | Technical + behavioral questions   | `/api/interview-prep`              |
| Usage & Pricing   | Free vs Pro limits, usage_logs     | `usage_logs`, middleware/helpers   |

## 5. Security Model

- All feature API routes require an authenticated user (Supabase JWT).
- File upload: validate MIME type and extension (PDF, DOCX only); scan size limits.
- Rate limiting: apply per-user/per-route limits (e.g. with Upstash or in-memory).
- No AI keys or secrets exposed to the client; all AI calls from API routes.

## 6. Scalability Considerations

- Stateless API routes; scale with Vercel serverless.
- Database connection pooling via Supabase.
- Storage and DB in same Supabase project to reduce latency.
- AI calls are the main bottleneck; consider queuing for heavy usage later.

## 7. Tech Stack Summary

| Layer      | Technology        |
|-----------|--------------------|
| Frontend  | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend   | Next.js API routes |
| Database  | Supabase PostgreSQL |
| Auth      | Supabase Auth     |
| Storage   | Supabase Storage  |
| AI        | OpenAI API (or Anthropic Claude) |
| Hosting   | Vercel            |
