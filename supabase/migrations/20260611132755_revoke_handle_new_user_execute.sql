/*
# Revoke public execute on handle_new_user()

1. Security Changes
   - Revoke EXECUTE on public.handle_new_user() from anon, authenticated, and public roles.
   - This function is a SECURITY DEFINER trigger handler that should only fire
     from the auth.users insert trigger, never be callable directly via PostgREST /rpc/.

2. Important Notes
   - The trigger itself still works because trigger execution does not require
     the calling role to have EXECUTE privilege on the function.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
