
-- Restrict has_role function
REVOKE EXECUTE ON FUNCTION public.has_role FROM anon;

-- Drop permissive anon policies on submissions
DROP POLICY "Anon can insert submissions" ON public.sediver_submissions;
DROP POLICY "Anon can update own submissions" ON public.sediver_submissions;
DROP POLICY "Anon can select own submissions" ON public.sediver_submissions;

-- More restrictive: anon can only SELECT client_access by access_code (already limited by query)
-- Keep the existing anon select policy on client_access for code verification
