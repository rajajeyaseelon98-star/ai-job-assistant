-- Ensure recipient-search RPC remains callable by authenticated users across environments.
-- Some environments drift and lose EXECUTE grants for SECURITY DEFINER functions.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'search_message_recipients'
  ) THEN
    REVOKE ALL ON FUNCTION public.search_message_recipients(text, int) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.search_message_recipients(text, int) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.search_message_recipients(text, int) TO service_role;
  END IF;
END
$$;
