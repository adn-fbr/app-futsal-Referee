# Phase 1.8D Behavioral Security Matrix

## Status

Ready for isolated test-project execution; blocked until infrastructure is provisioned.

| Control | Actor | Target | Operation | Expected |
| --- | --- | --- | --- | --- |
| RLS | USER_A | resource A | SELECT/INSERT/UPDATE/DELETE | policy-dependent ALLOW |
| RLS | USER_A | resource B | SELECT/INSERT/UPDATE/DELETE | DENY |
| RLS | USER_B | resource A | SELECT/INSERT/UPDATE/DELETE | DENY |
| RLS | USER_B | resource B | SELECT/INSERT/UPDATE/DELETE | policy-dependent ALLOW |
| Cross-region | region A user | region B data | direct/API/Edge | DENY unless approved business rule |
| IDOR | unauthorized user | known foreign UUID | read/mutate | DENY |
| Spoofing | USER_A | body says USER_B | create/update | server identity remains USER_A |
| Escalation | wasit/panitia/evaluator | admin operation | RPC/Edge/table | DENY |
| Role table | ordinary user | own/other role row | SELECT/INSERT/UPDATE/DELETE | no self-escalation |
| RPC | anon | sensitive RPC | invoke | DENY unless explicitly public |
| RPC | authenticated unauthorized | privileged RPC | invoke | DENY |
| SECURITY DEFINER | ordinary user | sensitive function | invoke | DENY unless approved |
| Audit | ordinary user | audit records | insert/update/delete | tamper-resistant DENY |
| Service role | browser client | privileged operation | invoke | DENY without trusted server auth |

## Result vocabulary

Every assertion is `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE`. `UNEXPECTED ALLOW` is `FAIL`; `UNEXPECTED DENY` requires policy/business-rule review.

## Scope

Run direct PostgREST/RLS tests and applicable Edge Function/RPC tests with synthetic identities only. Do not execute this matrix against production.
