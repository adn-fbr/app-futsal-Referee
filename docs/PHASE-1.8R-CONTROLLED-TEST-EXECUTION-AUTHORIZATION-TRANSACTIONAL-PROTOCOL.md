# PHASE 1.8R — Controlled Test Execution Authorization & Transactional Dry-Run Protocol

Date: 2026-09-24
Mode: READ-ONLY / EXECUTION PROTOCOL ONLY
Test project: `shorsqyycpptxcutrqrb`
Production: `xfscfjwapwnkiinkgbjg` — NOT TOUCHED

## Gate

**BLOCKED — execution authorization has not been granted.**

This phase defines the exact preconditions and abort-first protocol for a future controlled Test execution. No migration, DDL, DML, provider call, or deployment is performed by this phase.

## 1. Test environment rule

Test is not a clean clone of Production. Existing canonical notification, webhook, settings, referee-contact, and card-counter infrastructure must be preserved.

The candidate must converge state and must never replay historical baseline reconstruction artifacts.

`20260908085000 canonical_baseline_reconstruction` remains historical and must not be replayed.

## 2. Mandatory preflight

Before execution, capture a fresh snapshot of:

- migration history;
- public tables, columns, constraints and indexes;
- RLS state and policies;
- SECURITY DEFINER signatures, bodies, search_path and EXECUTE ACL;
- trigger names, functions, timing/events and enabled state;
- canonical notification constraints;
- card counter state;
- application function caller contracts.

Abort if any expected precondition differs unexpectedly.

## 3. Transaction boundary

The controlled candidate must run in a single transactional boundary where PostgreSQL permits transactional DDL.

Required shape:

```sql
BEGIN;

-- abort-first preconditions
-- canonical convergence
-- function replacement
-- ACL cutover
-- RLS/policy convergence
-- postcondition assertions

-- COMMIT only after every assertion succeeds
COMMIT;
```

Any assertion failure must terminate the transaction before commit.

No partial security boundary is acceptable.

## 4. Abort-first assertions

The candidate must abort if any of these fail:

1. expected function signature is missing;
2. unexpected duplicate function identity exists;
3. canonical table already exists with incompatible schema;
4. canonical constraint differs unexpectedly;
5. canonical trigger differs unexpectedly;
6. required trigger is disabled;
7. `search_path` remains unsafe on a rewritten canonical SECURITY DEFINER function;
8. `auth.role()` remains in a rewritten function body;
9. an internal SECURITY DEFINER function retains anon/authenticated EXECUTE unexpectedly;
10. an unapproved browser RPC gains EXECUTE;
11. `system_settings` becomes browser-readable;
12. internal notification tables gain browser policies;
13. public settings exposes private configuration;
14. `verify_referee_card()` exposes internal identifiers/counters;
15. card counter seed conflicts with existing card sequence;
16. `2026/737/0040` is present or reused;
17. six historical cancellation exceptions are altered;
18. historical notification rows are backfilled unexpectedly;
19. provider credentials are touched/read;
20. a provider network call is attempted;
21. migration history is changed outside the intended controlled mechanism;
22. any unexpected mutation occurs outside the candidate transaction.

## 5. Function ACL target

### Anonymous ALLOW

- `get_public_referee(uuid)`
- `get_public_referees(text, boolean)`
- `verify_referee_card(text)`

### Authenticated ALLOW

- `get_my_referee_event_count(date, date)`
- `transition_event_assignment_status(uuid, text, text)`

### Anonymous + authenticated DENY

All remaining SECURITY DEFINER functions unless a separately approved contract exists.

## 6. Test-specific existing functions

Existing Test functions such as:

- `claim_notification_channel`
- `finalize_notification_channel`
- `claim_event_completion_notification`
- `finalize_event_completion_notification`
- `create_event_completion_notification_intents`
- `issue_my_referee_card`
- `issue_referee_card_for_admin`
- `bulk_issue_referee_cards`

must not be overwritten or revoked merely because they are absent from the Production candidate. Their caller contracts must be evaluated separately.

## 7. RLS target

Canonical internal notification tables remain:

- RLS ON
- zero browser policies
- browser EXECUTE denied on internal RPCs

`public_application_settings` remains:

- RLS ON
- authenticated read according to the existing safe-settings contract
- service-managed writes
- no secret/private setting keys

`referee_contacts` remains self-service only according to its existing authenticated role/ownership policies.

## 8. Functional validation after candidate execution

If and only if execution is explicitly authorized, validate:

### Public RPC
- valid public referee lookup works;
- non-public/incomplete/deleted referee is not exposed;
- card verification returns bounded public data;
- invalid card is rejected safely;
- concurrent verification does not lose counter increments.

### Authenticated RPC
- own event count succeeds;
- cross-referee access is impossible;
- authorized assignment transition succeeds;
- unauthorized role is rejected;
- cross-region admin access is rejected;
- cancellation without reason is rejected;
- valid cancellation retains reason.

### Internal notification
- browser cannot call claim/finalize functions;
- idempotency constraints remain effective;
- provider webhook authentication remains unchanged.

### Legacy invariants
- card gap `2026/737/0040` remains absent;
- six historical cancelled assignments remain unchanged;
- no historical notification backfill occurs.

## 9. Rollback verification

Rollback must restore the exact pre-execution Test state for:

- function definitions;
- function ACL;
- RLS policies;
- canonical schema objects created by the candidate;
- trigger attachments;
- indexes/constraints created by the candidate.

Rollback must not use blanket `GRANT ALL TO PUBLIC`.

## 10. Production prohibition

Nothing in this phase authorizes Production execution.

Production remains read-only until a separate explicit authorization is provided after successful Test validation and post-test audit.

## 11. Safety counters

Production mutation: 0

Test mutation: 0

DDL: 0

DML: 0

Migration applied: 0

Deployment: 0

Provider calls: 0

Secret reads: 0

## 12. Final gate

**PHASE 1.8R — BLOCKED / EXECUTION NOT AUTHORIZED**

The protocol is ready. Execution requires an explicit authorization step and a fresh Test preflight immediately before execution.

## Next phase

**PHASE 1.8S — Test Pre-Execution Snapshot & Drift Lock**

Read-only snapshot immediately before any future controlled Test execution.
