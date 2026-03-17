-- Run this in Supabase SQL Editor if you get "permission denied for schema public"
-- This grants the anon and authenticated roles access to public schema and tables.
-- Keep in sync with all tables in the application.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Core tables
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.resumes TO anon, authenticated;
GRANT ALL ON public.resume_analysis TO anon, authenticated;
GRANT ALL ON public.improved_resumes TO anon, authenticated;
GRANT ALL ON public.job_matches TO anon, authenticated;
GRANT ALL ON public.usage_logs TO anon, authenticated;
GRANT ALL ON public.cover_letters TO anon, authenticated;
GRANT ALL ON public.interview_sessions TO anon, authenticated;
GRANT ALL ON public.user_preferences TO anon, authenticated;
GRANT ALL ON public.subscriptions TO anon, authenticated;

-- Job seeker feature tables
GRANT ALL ON public.job_searches TO anon, authenticated;
GRANT ALL ON public.applications TO anon, authenticated;
GRANT ALL ON public.auto_apply_runs TO anon, authenticated;

-- Recruiter tables
GRANT ALL ON public.companies TO anon, authenticated;
GRANT ALL ON public.job_postings TO anon, authenticated;
GRANT ALL ON public.job_applications TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.message_templates TO anon, authenticated;
GRANT ALL ON public.saved_searches TO anon, authenticated;

-- System tables
GRANT ALL ON public.ai_cache TO anon, authenticated;
GRANT ALL ON public.notifications TO anon, authenticated;

-- Smart features tables
GRANT ALL ON public.smart_apply_rules TO anon, authenticated;
GRANT ALL ON public.skill_badges TO anon, authenticated;
GRANT ALL ON public.candidate_skills TO anon, authenticated;

-- Network / monetization / data moat tables
GRANT ALL ON public.activity_feed TO anon, authenticated;
GRANT ALL ON public.platform_stats TO anon, authenticated;
GRANT ALL ON public.recruiter_pushes TO anon, authenticated;
GRANT ALL ON public.hiring_outcomes TO anon, authenticated;
GRANT ALL ON public.salary_data TO anon, authenticated;
GRANT ALL ON public.skill_demand TO anon, authenticated;

-- Addiction loop tables
GRANT ALL ON public.user_streaks TO anon, authenticated;
GRANT ALL ON public.daily_actions TO anon, authenticated;
GRANT ALL ON public.opportunity_alerts TO anon, authenticated;

-- Sequences (for default UUIDs / serials)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
