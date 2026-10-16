# PHASE 7.4I Security and RLS Design

## Security

- Execution model: **SECURITY INVOKER**.
- No `SECURITY DEFINER`.
- No service-role credential in browser code.
- No privilege escalation.
- Database and repository errors remain distinguishable from successful no-match.

The browser client already rejects service-role JWTs in `src/integrations/supabase/client.ts`; this remains a safety control, not authorization to create a privileged path.

## RLS

Target data surface: `public.events`, with baseline columns `id`, `name`, `date`, `location`, `status`, `kabupaten_kota_id`, and `deleted_at`.

Baseline evidence includes RLS enabled and an events SELECT policy named `Everyone can view events` with `USING (true)`. This policy is authoritative evidence only and must be revalidated in a safe non-Production environment. The design does not create or modify it.

Rich search must execute in caller authorization context and return only caller-authorized rows. It must not bypass RLS or use a service-role browser workaround.

## Design Gate

RLS design is **EVIDENCE REQUIRED** before implementation because the safe target environment and effective policy behavior have not been validated. If required visibility cannot operate under RLS, implementation is blocked; bypass is not an option.
