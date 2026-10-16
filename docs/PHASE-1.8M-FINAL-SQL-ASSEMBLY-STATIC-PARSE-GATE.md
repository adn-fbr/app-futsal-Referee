# PHASE 1.8M — Final SQL Assembly, Static Parse & Security Boundary Verification

Date: 2026-09-24  
Mode: READ-ONLY / CANDIDATE SQL ONLY  
Production: `xfscfjwapwnkiinkgbjg`

## Gate

**BLOCKED — final SQL assembly is structurally defined, but NOT executable against Production.**

No `apply_migration`, DDL, DML, GRANT, REVOKE, deployment, or provider call was executed.

## 1. Live precondition

The current Production baseline remains the pre-remediation state:

- 42 SECURITY DEFINER functions
- all 42 currently expose EXECUTE to `anon`
- all 42 currently expose EXECUTE to `authenticated`
- all 42 currently use `search_path=public`

The intended target is deny-by-default, with only five browser-callable RPC contracts.

## 2. Final browser RPC boundary

### Anonymous + authenticated

- `public.get_public_referee(uuid)`
- `public.get_public_referees(text, boolean)`
- `public.verify_referee_card(text)`

### Authenticated only

- `public.get_my_referee_event_count(date, date)`
- `public.transition_event_assignment_status(uuid, text, text)`

### All remaining SECURITY DEFINER functions

`anon` = DENY  
`authenticated` = DENY

No blanket `GRANT EXECUTE TO PUBLIC` is permitted.

## 3. Exact replacement strategy

The final migration candidate must replace the five approved bodies with `CREATE OR REPLACE FUNCTION` statements preserving the exact identity signatures.

Every replacement must include:

```sql
SECURITY DEFINER
SET search_path = ''
```

and every relation/function reference must be schema-qualified.

`auth.role()` is prohibited.

## 4. Function-specific static contract

### 4.1 `get_public_referee`

Must retain only the existing public projection:

- id
- full_name
- profile_photo_url
- license_level
- afk_origin
- kabupaten_kota_name
- is_active

Must retain:

- wasit role requirement
- approved registration
- profile complete
- non-deleted profile

No private profile columns may be introduced.

### 4.2 `get_public_referees`

Same public projection and eligibility rules as `get_public_referee`.

Search and active filters remain bounded to the function parameters.

### 4.3 `get_my_referee_event_count`

Caller identity must be derived exclusively from `auth.uid()`.

The existing self-binding:

```sql
p.id = auth.uid()
```

must remain.

No referee-id parameter may be introduced.

### 4.4 `transition_event_assignment_status`

The replacement must preserve all existing authorization invariants:

- authenticated actor required
- assignment row must exist and be active
- row lock with `FOR UPDATE`
- allowed target statuses only
- admin_provinsi authorization
- admin_kab_kota authorization with regional scope
- panitia authorization according to the existing application contract
- cancellation reason mandatory for `cancelled`
- update and return the locked assignment
- no cross-region access

The exact identity remains:

`(uuid, text, text)`

### 4.5 `verify_referee_card`

Public mutation remains allowed only because it is a narrowly bounded verification endpoint.

The candidate response must exclude internal identifiers and operational counters.

Allowed public response:

- `valid`
- `message`
- card number/status/issued-at/expiry
- limited referee identity/profile information
- public region name

Must not expose:

- card UUID
- referee UUID
- verification count
- internal created/updated timestamps
- internal database metadata

The verification counter must be incremented atomically, not from a stale previously-read value.

## 5. `soft_delete_record` disposition

A new read-only live check was performed.

Result:

- no non-internal public trigger attachment was returned for `soft_delete_record()`;
- the function nevertheless currently has `anon EXECUTE=true` and `authenticated EXECUTE=true`.

Therefore it is **not** classified as trigger-only.

Final migration rule:

- deny browser EXECUTE;
- do not delete it in this migration;
- do not rewrite it without an identified caller/trigger contract;
- preserve it until a separate dependency analysis establishes whether it is obsolete or required elsewhere.

This closes the previous ambiguity without inventing a caller.

## 6. Privileged reporting functions

Remain deny-by-default:

- `get_referees`
- `count_referees`
- `get_referee_event_count`
- `get_referee_income_summary`
- `get_admin_dashboard_summary`
- `get_audit_logs`
- `get_honor_statistics`
- `get_pending_registrations`
- `get_registration_history`

Reason: no authoritative browser caller contract has been verified for the unresolved functions, and several accept arbitrary region/referee identifiers or return sensitive aggregates.

## 7. Abort-first assertions

The migration candidate must abort before commit if any assertion fails.

### Function identity

- all expected signatures exist exactly once;
- no duplicate identity signature exists;
- transition signature is unchanged.

### SECURITY DEFINER hardening

- approved rewritten functions are SECURITY DEFINER;
- `search_path=''` is present;
- no `auth.role(` remains;
- object references are schema-qualified;
- caller identity uses `auth.uid()` where required.

### EXECUTE boundary

Expected final browser-visible set:

| Function | anon | authenticated |
|---|---:|---:|
| get_public_referee | ALLOW | ALLOW |
| get_public_referees | ALLOW | ALLOW |
| verify_referee_card | ALLOW | ALLOW |
| get_my_referee_event_count | DENY | ALLOW |
| transition_event_assignment_status | DENY | ALLOW |
| every other SECURITY DEFINER | DENY | DENY |

### Trigger integrity

All existing public user-defined triggers must remain enabled.

The migration must not disable triggers as part of ACL hardening.

### Private boundaries

- `system_settings`: no browser policy/access restoration
- `activity_logs`: private/internal
- `auth_attempts`: private/internal
- `event_logs`: private/internal
- notification canonical tables: internal-only
- `public_application_settings`: authenticated read / server-managed writes

### Data invariants

- card `2026/737/0040` remains absent;
- six historical cancelled assignments without reasons remain preserved;
- no historical notification backfill;
- no card renumbering;
- no legacy `XXX` card rewrite.

## 8. Static verification matrix

The final candidate must pass all of the following before any execution is considered:

1. SQL transaction structure is valid.
2. No mutation is performed by the static verification process.
3. No `apply_migration` is invoked.
4. No blanket `GRANT ... TO PUBLIC` exists.
5. No `auth.role()` exists in replacement bodies.
6. No browser EXECUTE grant exists for internal helpers.
7. No browser EXECUTE grant exists for privileged reporting functions.
8. Five approved RPC identities exist exactly once.
9. Trigger functions remain attached/enabled.
10. `soft_delete_record()` remains explicitly denied to browser roles.
11. Public verification response is bounded.
12. Counter increment is atomic.
13. System settings isolation remains intact.
14. Historical data assertions remain read-only and unchanged.
15. Any failed precondition aborts the migration before commit.

## 9. Important execution restriction

This document is a **candidate/static gate artifact**, not an applied migration.

It intentionally does not contain an instruction to execute the candidate against Production.

Before execution, a separate final SQL artifact must be generated and independently reviewed for exact function bodies and ACL statements.

## 10. Gate result

**PHASE 1.8M — BLOCKED**

The authorization boundary and abort-first verification model are now closed enough for final assembly, but the migration is not ready for Production execution because:

1. the exact replacement body for `verify_referee_card()` still requires final review of its public JSON contract and atomic counter update;
2. privileged reporting functions remain intentionally unresolved/denied;
3. `soft_delete_record()` is now explicitly classified as browser-denied but its lifecycle remains unresolved;
4. a final executable migration file has not been approved or applied.

## 11. Next phase

**PHASE 1.8N — Final Executable Migration Candidate & Independent Static Security Review**

Still READ-ONLY. Production mutation remains unauthorized.

## Safety counters

- Production mutation: 0
- Test mutation: 0
- DDL executed: 0
- DML executed: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0
