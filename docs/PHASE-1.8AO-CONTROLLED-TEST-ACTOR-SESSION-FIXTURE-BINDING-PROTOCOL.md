# PHASE 1.8AO — Controlled Test Actor Session & Fixture Binding Protocol

Date: 2026-09-24
Mode: READ-ONLY / PRE-EXECUTION
Project: test APP (`shorsqyycpptxcutrqrb`)
Production: EXCLUDED

## Objective
Freeze the actor/session/role/region/fixture binding required for controlled negative-path execution without executing mutation-capable RPCs.

## Required actor classes
1. anonymous
2. wasit A
3. wasit B
4. admin_kab_kota A — Bantaeng
5. admin_kab_kota B — Barru
6. admin_provinsi
7. server-side/service-role context — Edge Function internal only

## Binding rules
- Actor identity must be represented by a non-secret identifier only.
- JWT, access token, refresh token, service-role key, and provider credentials must never enter evidence.
- Role evidence must come from `user_roles`, not editable user metadata.
- Region evidence must come from the canonical profile/region relationship.
- Incomplete actors must not be used as positive fixtures.
- A fixture must be bound to exactly one expected authorization scope before execution.

## Fixture matrix
| Case family | Actor | Target | Expected |
|---|---|---|---|
| anonymous privileged RPC | anonymous | privileged RPC | DENY |
| wasit → admin operation | wasit A | admin card/registration operation | DENY |
| cross-user card | wasit A | wasit B card | DENY |
| cross-region admin | admin Bantaeng | Barru target | DENY |
| reverse cross-region | admin Barru | Bantaeng target | DENY |
| regional → province aggregate | admin kab/kota | all-region dashboard | DENY |
| authenticated → internal notification | authenticated | claim/finalize | DENY |
| helper/oracle | authenticated | arbitrary user/region/schedule target | DENY |
| invalid card transition | authorized admin | invalid transition | DENY |
| missing revoke reason | authorized admin | revoke without reason | DENY |
| unauthorized completion | non-authorized actor | approved event outside scope | DENY |

## Preconditions
- Existing Test role population is structurally suitable for most negative cases.
- Two distinct regional admin scopes exist: Bantaeng and Barru.
- Registration cases remain BLOCKED until a disposable pending-registration fixture exists.
- Positive execution is not authorized by this phase.

## Execution prohibition
This phase performs no RPC execution, INSERT, UPDATE, DELETE, migration, DDL, deployment, provider call, or secret read.

## Abort conditions
Abort the next execution phase if:
- actor role/region cannot be proven;
- actor/session mapping is ambiguous;
- fixture belongs to the wrong actor or region;
- a target fixture is not disposable/rollback-safe;
- expected authorization cannot be stated before execution;
- evidence would require storing a secret token;
- production project is selected accidentally.

## Gate
BLOCKED — session evidence and disposable-fixture binding must be explicitly closed before controlled execution.

## Safety counters
Production mutation: 0
Test mutation: 0
DDL/DML: 0
Migration applied: 0
Deployment: 0
Provider calls: 0
Secret reads: 0
