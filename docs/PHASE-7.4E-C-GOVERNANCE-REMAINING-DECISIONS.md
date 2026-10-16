# PHASE-7.4E-C Governance Remaining Decisions

Version: v1.0.0
Status: GOVERNANCE REQUIRED

Only unresolved or conflicting decisions are listed here. Facts already established by codebase or canonical evidence are not repeated as pending decisions.

1. Rich-search function identity: name and schema.
2. Exact PostgreSQL signature, argument types, nullability, defaults, and validation.
3. Approved return type, returned columns, nullability, and sensitive-field policy.
4. Whether historical CASE scoring is retained or replaced; similarity threshold policy.
5. Matching field semantics and cross-scope visibility.
6. Deterministic ordering, maximum result limit, and pagination policy.
7. SECURITY INVOKER versus SECURITY DEFINER, EXECUTE roles, and fixed search path.
8. RLS behavior and leakage protection for event/region visibility.
9. Performance target, workload assumptions, query operator, and index authorization.
10. Error, timeout, permission-denial, and empty-result behavior.
11. Compatibility disposition and repository migration authorization.
12. Migration, rollback, deployment authorization, and new baseline/dependency graph revision process.

The existing canonical function remains KEEP and unchanged. No pending item authorizes implementation or Production mutation.
