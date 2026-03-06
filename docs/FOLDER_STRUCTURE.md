# AI Job Assistant – Folder Structure

```
ai-job-assistant/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── resume-analyzer/
│   │   └── page.tsx
│   ├── job-match/
│   │   └── page.tsx
│   ├── cover-letter/
│   │   └── page.tsx
│   ├── interview-prep/
│   │   └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       ├── analyze-resume/
│       │   └── route.ts
│       ├── improve-resume/
│       │   └── route.ts
│       ├── job-match/
│       │   └── route.ts
│       ├── generate-cover-letter/
│       │   └── route.ts
│       ├── interview-prep/
│       │   └── route.ts
│       ├── upload-resume/
│       │   └── route.ts
│       ├── usage/
│       │   └── route.ts
│       └── auth/
│           └── callback/
│               └── route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── DashboardLayout.tsx
│   ├── dashboard/
│   │   ├── ScoreCard.tsx
│   │   ├── UsageCard.tsx
│   │   ├── ActivityList.tsx
│   │   └── QuickActions.tsx
│   ├── resume/
│   │   ├── ResumeUpload.tsx
│   │   └── ResumeAnalysisResult.tsx
│   ├── job/
│   │   ├── JobMatchForm.tsx
│   │   └── MatchResult.tsx
│   ├── cover-letter/
│   │   ├── CoverLetterForm.tsx
│   │   └── CoverLetterResult.tsx
│   ├── interview/
│   │   └── InterviewQuestions.tsx
│   └── ui/
│       ├── Card.tsx
│       ├── Button.tsx
│       └── ProgressBar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── openai.ts
│   ├── auth.ts
│   └── usage.ts
├── hooks/
│   ├── useUser.ts
│   └── useSubscription.ts
├── types/
│   ├── resume.ts
│   ├── jobMatch.ts
│   └── analysis.ts
├── utils/
│   ├── pdfParser.ts
│   └── docxParser.ts
├── supabase/
│   └── schema.sql
├── docs/
│   ├── ARCHITECTURE.md
│   └── FOLDER_STRUCTURE.md
├── public/
│   └── logo.svg
├── .env.local.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```
