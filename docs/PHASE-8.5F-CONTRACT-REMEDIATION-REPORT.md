# Phase 8.5F Contract Remediation Report

## Final gate

`PARTIAL — CONTRACT REMEDIATION IMPLEMENTED, VALIDATION INCOMPLETE`

## Authorized scope

Target: Non-Production `shorsqyycpptxcutrqrb`. Production `xfscfjwapwnkiinkgbjg` was not queried, mutated, regenerated, or deployed.

## Implemented

- Corrected `public.check_duplicate_event(text,text,text)` to compare `events.kabupaten_kota_id`, `location`, and `name`.
- Preserved boolean return and exact identity.
- Used `SECURITY INVOKER`, `STABLE`, and `SET search_path = public`.
- NULL inputs return `false`; date, status, and deleted state are not duplicate dimensions.
- Regenerated `src/integrations/supabase/types.ts` from linked Non-Production.
- Reconciled the only active caller and UI to boolean semantics.
- Did not implement event plus approval transaction atomicity.

## Validation

Live Non-Production validation confirmed one exact three-argument function, boolean return, invoker security, fixed search_path, one overload, and canonical regional column usage. No five-argument overload or rich RPC exists.

Read-only behavior probes passed for no-match, different name, different location, and NULL inputs. Exact-match TRUE and data-dependent different-region/case checks were not executed because the target contains no event row with non-null region, location, and name; creating fixtures was not authorized.

Typecheck, tests (28), and build pass. Lint remains the documented baseline: 66 errors and 11 warnings.

## Remaining gap

Dynamic Auth/RLS identity tests and exact-match TRUE behavior require an approved synthetic fixture channel. Production UAT remains `NOT READY`.
