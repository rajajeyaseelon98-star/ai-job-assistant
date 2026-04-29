-- Realtime postgres_changes UPDATE filters need full row visibility for reliable delivery
-- (e.g. read_at updates on messages the current user sent).
ALTER TABLE public.messages REPLICA IDENTITY FULL;
