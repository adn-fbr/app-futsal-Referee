# PHASE 1.8N — Final Executable Migration Candidate & Independent Static Review

Date: 2026-09-24  
Mode: READ-ONLY / CANDIDATE ONLY  
Production: `xfscfjwapwnkiinkgbjg`

## Gate

**BLOCKED — executable candidate specification assembled; NOT APPLIED.**

This phase does not execute DDL, DML, GRANT, REVOKE, migration application, or deployment.

## 1. Intended final boundary

### Anonymous + authenticated
- `get_public_referee(uuid)`
- `get_public_referees(text, boolean)`
- `verify_referee_card(text)`

### Authenticated only
- `get_my_referee_event_count(date, date)`
- `transition_event_assignment_status(uuid, text, text)`

### Browser denied
Every other SECURITY DEFINER function, including reporting, authorization helpers, trigger/internal functions, and legacy card generation.

No blanket `PUBLIC EXECUTE` grant is permitted.

## 2. Independent live preflight

The current Production RLS inventory still contains four RLS-enabled tables with zero policies:

- `activity_logs`
- `auth_attempts`
- `event_logs`
- `system_settings`

This is consistent with the frozen contract that these are private/internal boundaries, but the final migration must explicitly assert that no browser-facing policy is introduced.

The current live Production SECURITY DEFINER baseline remains the pre-remediation state established in Phase 1.8K: the 42 audited SECURITY DEFINER functions retain broad browser EXECUTE exposure and `search_path=public`. This remains a precondition failure until the candidate rewrite/ACL cutover is actually applied and verified.

## 3. Executable candidate structure

The final migration candidate must be transactionally structured as:

1. `BEGIN`
2. abort-first baseline assertions
3. exact signature assertions
4. trigger-preservation assertions
5. canonical function body replacement
6. explicit `search_path=''`
7. explicit ACL revocation
8. explicit grants only for the five approved browser RPCs
9. canonical-table/RLS assertions where those objects are included in the migration
10. historical-data assertions
11. post-cutover security assertions
12. `COMMIT`

Any failed assertion must abort before commit.

## 4. Function-body requirements

Every rewritten SECURITY DEFINER function must satisfy all of:

- `SECURITY DEFINER`
- `SET search_path = ''`
- fully schema-qualified application objects
- no `auth.role()`
- authenticated functions bind to `auth.uid()`
- no caller authorization based solely on an arbitrary `_user_id`, `_referee_id`, or `_kabupaten_kota_id`
- exact identity signature preserved
- existing business-rule invariants preserved

## 5. `verify_referee_card()` final safety requirements

The public response must be bounded to verification-safe fields only:

- `valid`
- `message`
- `card_number`
- `issued_at`
- `expires_at`
- `status`
- referee public identity/profile fields needed by the verification UI
- public region name where required

The response must not expose internal UUIDs, verification counters, internal timestamps, or database implementation metadata.

Verification-count increment must be atomic under concurrent verification.

## 6. `soft_delete_record()` disposition

`soft_delete_record()` remains unresolved as an application contract. Live inspection did not establish a non-internal trigger attachment.

Therefore the final candidate must:

- revoke anonymous EXECUTE;
- revoke authenticated EXECUTE;
- retain the function until caller/trigger lineage is explicitly resolved;
- not delete or rewrite it merely because it returns `trigger`.

## 7. Privileged reporting functions

The following remain deny-by-default for browser callers:

- `get_referees`
- `count_referees`
- `get_referee_event_count`
- `get_referee_income_summary`
- `get_admin_dashboard_summary`
- `get_audit_logs`
- `get_honor_statistics`
- `get_pending_registrations`
- `get_registration_history`

Existing internal authorization in some functions does not establish that direct browser EXECUTE is required.

## 8. Abort-first assertions

The executable candidate must stop if any of these fail:

1. expected SECURITY DEFINER signature count/identity differs;
2. duplicate function identity exists;
3. transition RPC signature differs;
4. any required trigger is disabled or missing;
5. a canonical function still contains `auth.role()`;
6. canonical function `search_path` is not empty;
7. an unapproved function has `anon` EXECUTE;
8. an unapproved function has `authenticated` EXECUTE;
9. a public RPC exposes non-public fields;
10. notification canonical tables are browser-readable;
11. `system_settings` receives browser policy/grant;
12. `activity_logs`, `auth_attempts`, or `event_logs` receive browser policy/grant;
13. `public_application_settings` loses authenticated-read/service-managed boundary;
14. card sequence `2026/737/0040` is altered or recreated;
15. six historical cancelled assignments are altered;
16. historical notification backfill is attempted;
17. a blanket `GRANT ... TO PUBLIC` is introduced;
18. transaction cannot complete atomically.

## 9. Independent static review result

### PASS — design properties

- deny-by-default privileged RPC policy
- five-function browser API boundary
- `auth.role()` prohibition
- `search_path=''` target
- trigger preservation requirement
- historical card-gap preservation
- historical cancellation preservation
- no notification backfill
- no blanket PUBLIC grant
- transactional/abort-first design

### BLOCKED — execution properties

- exact replacement SQL body text has not been applied/verified;
- `verify_referee_card()` atomic counter rewrite has not been executed/verified;
- `soft_delete_record()` caller lineage remains unresolved;
- current live ACL remains pre-remediation;
- current live SECURITY DEFINER search paths remain pre-remediation;
- privileged reporting contracts remain intentionally unresolved.

## 10. Production safety counters

- Production mutation: **0**
- Test mutation: **0**
- DDL: **0**
- DML: **0**
- Migration applied: **0**
- Deployment: **0**
- Provider calls: **0**
- Secret reads: **0**

## 11. Final status

**PHASE 1.8N — BLOCKED / FINAL EXECUTABLE CANDIDATE NOT YET ELIGIBLE FOR APPLY**

The next gate is **PHASE 1.8O — Independent SQL Candidate Review & Pre-Apply Checklist**.

No production mutation is authorized by this phase.
