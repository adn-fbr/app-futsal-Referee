# PHASE-7.4E Formal Duplicate Search Contract Approval

Version: v1.0.0
Status: BLOCKED

## Governance decision

OPTION C - SEPARATE RESPONSIBILITIES.

The existing canonical function remains unchanged: `public.check_duplicate_event(text,text,text) RETURNS boolean`.

The proposed rich-search capability remains a separate contract. Its implementation-critical fields are still `TBD / GOVERNANCE REQUIRED`; therefore formal approval cannot be granted.

## Approval checklist

| # | Item | Status | Evidence / decision |
| ---: | --- | --- | --- |
| 1 | Rich-search function name | TBD | Not defined in 7.4D |
| 2 | PostgreSQL schema | TBD | Placement not approved |
| 3 | Exact argument count | TBD | Five observed historically, not approved as new contract |
| 4 | Exact argument names | TBD | Application names are evidence, not approval |
| 5 | Exact argument types | TBD | Historical types do not establish current contract |
| 6 | NULL semantics | TBD | Requires governance decision |
| 7 | Exact return type | TBD | Historical table result not approved |
| 8 | Returned columns | TBD | Observed fields require approval |
| 9 | Similarity algorithm | TBD | Historical CASE logic; no approved algorithm |
| 10 | Similarity threshold | TBD | Not approved |
| 11 | Matching fields | TBD | Candidate fields observed, policy unresolved |
| 12 | Matching normalization | TBD | Not approved |
| 13 | Result ordering | TBD | Deterministic rule not approved |
| 14 | Limit | TBD | Not approved |
| 15 | Pagination | TBD | Not approved |
| 16 | SECURITY INVOKER / DEFINER | TBD | Not approved |
| 17 | EXECUTE privileges | TBD | Not approved |
| 18 | Authentication requirements | TBD | Not approved |
| 19 | RLS behavior | TBD | RLS remains authoritative; behavior unresolved |
| 20 | Cross-scope leakage protection | TBD | Not approved |
| 21 | Required indexes | TBD | No index authorized |
| 22 | Performance target | TBD | Not approved |
| 23 | Error semantics | TBD | Not approved |
| 24 | Empty-result semantics | TBD | Not approved |
| 25 | Application DTO mapping | APPROVED AS OBSERVATION | Existing DTO documented in 7.4D; implementation mapping not authorized |
| 26 | Repository boundary | APPROVED AS DIRECTION | Repository boundary is required; method contract not approved |
| 27 | Backward compatibility | TBD | Canonical function disposition remains KEEP pending governance |
| 28 | Migration strategy | TBD | Design exists, authorization absent |
| 29 | Rollback strategy | TBD | Design exists, authorization absent |
| 30 | Baseline revision strategy | APPROVED AS RULE | New revision only after approved implementation and validation; current baseline unchanged |

## Decision

Formal contract status: `BLOCKED`.

Decision authority and reviewers have not supplied named approvals or timestamps. Recommendation is not authorization.
