-- Rows marked read before read_at existed: set read_at so Sent/Read UI is consistent.
-- Uses message created_at as a conservative placeholder (true read time was not recorded).
UPDATE public.messages
SET read_at = created_at
WHERE is_read = true
  AND read_at IS NULL;
