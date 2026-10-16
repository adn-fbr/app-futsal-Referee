# PHASE-7.4B Security Impact

Version: v1.0.0
Status: GOVERNANCE_DECISION_REQUIRED

## Current canonical function

`public.check_duplicate_event(text,text,text)` is `SECURITY DEFINER` in the baseline. Its grants, fixed search path, caller roles, and RLS interaction must remain governed by the existing contract. No new access is authorized.

## Historical/application function

The five-argument historical function is also `SECURITY DEFINER`, searches event data, excludes rejected/deleted rows, and returns event metadata. A future implementation would require explicit decisions for:

- authenticated roles permitted to invoke it;
- whether returned event metadata is visible across regions or tenants;
- whether region filtering is mandatory or merely optional input;
- whether `p_exclude_event_id` can be abused to alter duplicate results;
- fixed `search_path`, ownership, grants, and error behavior;
- RLS behavior for both source rows and function execution;
- validation of names, dates, ids, and search limits;
- rate limiting or abuse controls for repeated search calls.

All values are `TBD / GOVERNANCE REQUIRED`; none are inferred from historical SQL.

## Recommendation security posture

Option C is preferred because the cheap boolean check and rich search have separate least-privilege contracts. This does not remove the need for a new security review. Browser code must not receive service-role credentials, bypass RLS, or rely on client-side authorization.

No security policy, function, grant, RLS rule, or application code was changed.
