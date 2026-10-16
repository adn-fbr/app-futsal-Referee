# PHASE 1.8AG — Controlled Test Identity & Fixture Inventory Closure

Date: 2026-09-24
Mode: READ-ONLY / TEST ONLY
Project: test APP (`shorsqyycpptxcutrqrb`)
Gate: BLOCKED

## 1. Objective

Menutup evidence identity dan fixture yang diperlukan untuk Phase 1.8AE negative-path authorization tests, tanpa menjalankan RPC yang dapat mengubah state.

Production tetap di luar scope eksekusi.

## 2. Identity inventory evidence

Current Test `user_roles` aggregate:

- `admin_provinsi`: 3 users
- `admin_kab_kota`: 2 users
- `wasit`: 4 users

Regional distribution from `profiles` + `user_roles`:

- `admin_provinsi`: 3 users, no kabupaten/kota binding
- `admin_kab_kota`: 2 users, one in Bantaeng and one in a second distinct kabupaten/kota
- `wasit`: 4 users distributed across Luwu Utara, Makassar, Bantaeng, and one user without kabupaten/kota binding

This is sufficient to establish that the Test project contains candidate identities for:

- provincial administrator
- two distinct regional administrators
- multiple referees
- at least one same-region referee relationship for regional tests
- at least one cross-region referee relationship

Exact user identifiers are intentionally not reproduced in this report. They must be selected from the live Test project only when an authorized execution harness is prepared.

## 3. Required execution fixtures

| Fixture | Required | Current closure |
|---|---|---|
| Anonymous/no JWT | Yes | Available conceptually; no RPC executed |
| Wasit A | Yes | Candidate identity exists |
| Wasit B | Yes | Candidate identity exists |
| Admin Kab/Kota A | Yes | Candidate identity exists |
| Admin Kab/Kota B | Yes | Candidate identity exists |
| Admin Provinsi | Yes | Candidate identities exist |
| Card A/B | Yes | Test has referee-card domain; exact pair not frozen here |
| Assignment A/B | Yes | Test has assignment domain; exact pair not frozen here |
| Event DISETUJUI | Yes | Required; exact execution fixture not frozen here |
| Pending registration | Conditional | Required for registration negative tests; exact fixture not frozen here |
| Notification intent | Conditional | Required only for controlled internal-boundary validation |

## 4. Negative-path mapping

The following actor/target combinations are required before execution:

1. anonymous → `approve_registration` = DENY
2. anonymous → `reject_registration` = DENY
3. anonymous → `issue_my_referee_card` = DENY
4. anonymous → `mark_event_completed` = DENY
5. anonymous → `transition_event_assignment_status` = DENY
6. wasit A → admin card operation = DENY
7. wasit A → own card self-service = ALLOW only after positive contract verification
8. wasit A → card B = DENY
9. admin region A → target card/registration region B = DENY
10. admin region A → dashboard region B = DENY
11. admin region A → all-region dashboard = DENY
12. admin provinsi → authorized administrative operation = ALLOW only after positive contract verification
13. authenticated browser → notification claim = DENY
14. authenticated browser → notification finalize = DENY
15. browser → trigger/internal function = DENY
16. authenticated browser → `generate_card_number` = DENY
17. anonymous → `get_audit_logs` = DENY
18. anonymous → `get_honor_statistics` = DENY
19. anonymous → `get_pending_registrations` = DENY
20. anonymous → `get_registration_history` = DENY
21. authenticated user → arbitrary user-region helper = DENY/internal-only
22. authenticated user → arbitrary schedule-conflict probe = DENY/internal-only
23. admin → invalid card transition = DENY
24. admin → revoke without reason = DENY
25. wasit → another referee assignment = DENY
26. regional admin → assignment in another region = DENY

## 5. Important evidence boundary

Identity existence is established at aggregate level, but exact actor-to-target fixture mapping is not yet frozen. Therefore these results are readiness evidence, not authorization-test results.

No live negative-path RPC was executed in this phase.

## 6. Safety constraints

Before any controlled execution:

- confirm project ref is `shorsqyycpptxcutrqrb`;
- reject any production ref;
- snapshot relevant rows/ACLs;
- use disposable or explicitly designated Test fixtures;
- record expected error/success class before execution;
- abort on any unexpected mutation, disclosure, cross-region access, counter increment, notification claim, or state transition;
- do not read passwords, secrets, service-role keys, or provider credentials.

## 7. Gate decision

**BLOCKED.**

Identity-role availability is materially improved and the Test project has the required role populations. However, exact actor/target fixture pairs and an execution-authorized harness are not yet frozen. The negative-path RPCs remain unexecuted.

Safety counters:

- Production mutations: 0
- Test mutations: 0
- DDL: 0
- DML: 0
- ACL changes: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## 8. Next phase

**PHASE 1.8AH — Test Fixture Pairing & Read-Only Precondition Closure**

Scope: identify exact non-sensitive target fixtures for each negative-path case, verify status/ownership/region preconditions read-only, and freeze the execution map. No mutation authorization is implied by this phase.
