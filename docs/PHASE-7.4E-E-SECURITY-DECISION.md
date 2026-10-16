# PHASE-7.4E-E Security Decision

Version: v1.0.0
Status: SECURITY_APPROVAL_REQUIRED

## Recommendation

Prefer `SECURITY INVOKER` with RLS respected. Do not use service-role credentials in browser code and do not bypass RLS. A SECURITY DEFINER exception requires explicit owner, fixed search_path, schema qualification, privileges, accessible rows, and mitigation approval.

## Required decisions

Authenticated/anonymous access, EXECUTE roles, event visibility, cross-scope leakage protection, sensitive fields, input validation, rate limiting, abuse prevention, audit requirements, and exact RLS behavior remain approval items. The caller-supplied region filter is not an authorization boundary.

Current status: recommendation only; Security Owner and Database Owner approval required.

No policy, grant, function, or RLS rule was changed.
