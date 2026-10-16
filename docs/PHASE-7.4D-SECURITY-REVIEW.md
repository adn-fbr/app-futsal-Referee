# PHASE-7.4D Security Review

Version: v1.0.0
Status: DESIGN ONLY

## Current canonical function

`public.check_duplicate_event(text,text,text) RETURNS boolean` remains unchanged. Its existing SECURITY DEFINER semantics, grants, owner, search path, and RLS interaction are not reinterpreted by this design.

## Rich-search decisions required

| Decision | Current value |
| --- | --- |
| SECURITY INVOKER vs SECURITY DEFINER | TBD / GOVERNANCE REQUIRED |
| Authenticated access | TBD / GOVERNANCE REQUIRED |
| Anonymous access | TBD / GOVERNANCE REQUIRED |
| Required role | TBD / GOVERNANCE REQUIRED |
| RLS interaction | TBD / GOVERNANCE REQUIRED |
| Cross-user/event visibility | TBD / GOVERNANCE REQUIRED |
| Region boundary | TBD / GOVERNANCE REQUIRED |
| Sensitive fields returned | TBD / GOVERNANCE REQUIRED |
| EXECUTE privileges | TBD / GOVERNANCE REQUIRED |
| Rate limiting and abuse prevention | TBD / GOVERNANCE REQUIRED |
| Audit requirement | TBD / GOVERNANCE REQUIRED |

RLS remains authoritative. A SECURITY DEFINER design, if selected, must specify owner, fixed search path, privilege minimization, row visibility, and mitigation for cross-boundary leakage. No security rule is created by this document.

## Threats requiring review

Similarity results can disclose event names, dates, locations, statuses, or regional relationships across users. Optional region and exclusion inputs must not become authorization controls supplied solely by the caller. The current error-to-allow behavior also requires product and security review.

No service-role credential, RLS bypass, grant, policy, or function was added.
