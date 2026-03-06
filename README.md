# AI Job Assistant

A production-ready SaaS that helps software developers (0–5 years experience) improve resumes, match job descriptions, generate cover letters, and prepare for interviews using AI.

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (resumes)
- **AI:** OpenAI API (or Anthropic Claude)
- **Hosting:** Vercel

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key (or Anthropic API key)
- Vercel account (for deployment)

## Installation Steps

### 1. Clone and install dependencies

```bash
cd ai-job-assistant
npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the contents of `supabase/schema.sql` to create tables and RLS policies.
3. In **Storage**, create a bucket named `resumes`. In **Policies**, add: (a) Allow authenticated users to INSERT with condition `(bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)`; (b) Allow SELECT for same; (c) Allow DELETE for same.
4. In **Authentication > URL Configuration**, add your app URL and redirect URLs (e.g. `http://localhost:3000`, `http://localhost:3000/auth/callback`).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `OPENAI_API_KEY` | OpenAI API key for AI features |

## Deployment (Vercel)

1. Push your code to GitHub/GitLab/Bitbucket.
2. In Vercel, **Import** the repository.
3. Add the same environment variables in **Project Settings > Environment Variables**.
4. In Supabase **Authentication > URL Configuration**, add your production URL and callback (e.g. `https://your-app.vercel.app`, `https://your-app.vercel.app/auth/callback`).
5. Deploy. Run migrations (schema.sql) on your Supabase project if not already done.

## Project structure

See [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Features

- **Auth:** Sign up, login, logout, reset password (Supabase Auth)
- **Resume upload:** PDF/DOCX upload, text extraction, storage in Supabase
- **Resume analysis:** ATS score, strengths, weaknesses, missing keywords, suggestions
- **Resume improvement:** AI-powered bullet point rewrites
- **Job match:** Match score, missing skills, recommended keywords
- **Cover letter:** Generate from resume + job description
- **Interview prep:** Technical and behavioral questions by role
- **Pricing:** Free (limited) and Pro (unlimited) with usage tracking

## License

MIT
