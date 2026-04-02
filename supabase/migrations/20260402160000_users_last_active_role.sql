-- Remember preferred landing surface after login (kept in sync with role on PATCH /api/user/role).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_active_role TEXT NOT NULL DEFAULT 'job_seeker'
  CHECK (last_active_role IN ('job_seeker', 'recruiter'));

UPDATE public.users SET last_active_role = role WHERE last_active_role IS DISTINCT FROM role;
