# Phase 1.8E.2 Security Equivalence

## Status

**BLOCKED** pending target baseline deployment and catalog comparison.

## Production security reference

- RLS enabled on all 27 public tables.
- 86 runtime policies.
- 41 SECURITY DEFINER functions among 47 public functions.
- `app_role` contains five canonical values.
- Three views use security-invoker mode.
- Broad table grants to `anon`, `authenticated`, and `service_role` exist in the reference and must be reproduced only as an approved test posture.

## Required test equivalence checks

1. RLS enabled/forced state matches.
2. Policy command, role, `USING`, and `WITH CHECK` expressions match.
3. Function signatures, bodies, owners, security mode, and search paths match.
4. Execute privileges are documented and match the approved test posture.
5. Role enum values match exactly.
6. Regional and resource foreign keys match.
7. Views retain security-invoker behavior.
8. Audit and trigger functions match.
9. No production data, Auth rows, secrets, or credentials exist in the test project.

No security remediation is permitted during equivalence deployment.
