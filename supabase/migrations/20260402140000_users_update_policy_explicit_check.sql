-- Reinstate UPDATE on public.users with explicit WITH CHECK so role changes are not rejected
-- by ambiguous RLS evaluation (symptom: PATCH /api/user/role returns RLS / permission errors).

DROP POLICY IF EXISTS "Users can update own row" ON public.users;
CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
