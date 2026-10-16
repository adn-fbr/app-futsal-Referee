# PHASE 1.8J — Canonical Rewrite Specification & Replacement RPC Contract

Date: 2026-09-24
Mode: READ-ONLY
Target: Production `xfscfjwapwnkiinkgbjg`

## Gate

**BLOCKED — specification is frozen for candidate assembly, but no migration is authorized.**

No DDL, DML, ACL mutation, function replacement, migration application, deployment, or provider call was performed.

## 1. Objective

Freeze the exact security contract for the small set of RPCs that may remain browser-callable, while converting every unresolved privileged function to deny-by-default until an explicit application contract exists.

## 2. Final browser RPC boundary

### PUBLIC-SAFE

1. `get_public_referee(uuid)`
2. `get_public_referees(text, boolean)`
3. `verify_referee_card(text)` — special bounded public mutation

### AUTHENTICATED APPLICATION

1. `get_my_referee_event_count(date, date)` — caller bound to `auth.uid()`
2. `transition_event_assignment_status(uuid, text, text)` — authenticated actor plus role/region/state authorization

No other currently SECURITY DEFINER Production function receives authenticated browser EXECUTE in this phase.

## 3. Privileged functions: deny-by-default

The following remain `anon DENY` and `authenticated DENY` until a future caller contract is proven:

- `get_referees(...)`
- `count_referees(...)`
- `get_referee_event_count(...)`
- `get_referee_income_summary(...)`
- `get_admin_dashboard_summary(...)`
- `get_audit_logs(...)`
- `get_honor_statistics(...)`
- `get_pending_registrations()`
- `get_registration_history()`
- `soft_delete_record()`

For the two registration functions, the existing body authorization is useful but does not justify an ACL relaxation until the body/search_path rewrite is completed.

## 4. Required body rewrites

All retained SECURITY DEFINER functions must target:

`SET search_path = ''`

and use schema-qualified application objects. `auth.role()` is prohibited.

### `get_my_referee_event_count`

Preserve the self-binding:

`p.id = auth.uid()`

Retain authenticated-only execution. Qualify all application relations. No arbitrary referee identifier is accepted.

### `transition_event_assignment_status`

Preserve:

- non-null `auth.uid()`;
- assignment lookup with `deleted_at IS NULL`;
- row lock `FOR UPDATE`;
- roles `admin_provinsi`, `admin_kab_kota`, `panitia`;
- regional restriction for `admin_kab_kota`;
- allowed target statuses;
- required cancellation reason;
- update of cancellation actor/reason;
- unchanged identity signature.

The six historical cancelled assignments without reasons must remain untouched.

### `get_public_referee` / `get_public_referees`

Retain only the current explicit public projection and eligibility checks. No additional private profile columns may be exposed.

### `verify_referee_card`

This remains the only public mutating RPC candidate. Before execution, its output contract must be reduced to the minimum public verification fields. The current payload contains operational timestamps/counters and should not be copied blindly into the final rewrite.

Its mutation remains limited to verification logging and verification counters/timestamps. No secret or administrative data may be returned.

## 5. Privileged function treatment

### `get_referees` / `count_referees`

Current `auth.role() = 'authenticated' OR p.is_active = true` is rejected. This creates an anonymous/public fallback and must not survive.

If browser reporting is later required, introduce an explicit admin/role/region contract rather than restoring the fallback.

### `get_referee_event_count`

Current arbitrary `_kabupaten_kota_id` is an authorization boundary. A caller must not choose another region merely by changing the argument.

### `get_referee_income_summary`

Same regional issue, with additional financial sensitivity. Default browser deny remains.

### `get_admin_dashboard_summary`

`NULL` region currently means aggregate across all regions. This is not an acceptable implicit authorization rule. All-region scope must be an explicit provincial-admin decision.

### `get_honor_statistics`

Arbitrary `_referee_id` plus financial totals is not self-safe. Browser execution remains denied until either a self-only contract or explicit privileged contract is implemented.

### `get_audit_logs`

Contains `old_data`, `new_data`, `metadata`, and actor information. Browser execution remains denied pending explicit admin authorization.

### `get_pending_registrations` / `get_registration_history`

Existing body authorization checks provincial or regional admin scope. They still require search_path hardening and final caller verification before any ACL cutover.

### `soft_delete_record`

The function returns `trigger`, but current catalog evidence did not prove an active user trigger attachment. It must not be labeled trigger-only until an attachment is explicitly verified. Browser execution remains denied.

## 6. Internal functions

All internal authorization/business-rule functions remain inaccessible to `anon` and `authenticated`:

- role/region helpers;
- `has_schedule_conflict`;
- `is_event_approved`;
- `is_referee_active`;
- registration authorization helpers;
- card-number legacy helper;
- trigger functions.

Trigger execution must remain enabled independently of direct EXECUTE grants.

## 7. Search-path hardening contract

For each rewritten SECURITY DEFINER function:

1. `search_path = ''` where feasible;
2. every `public` object explicitly qualified;
3. every helper reference verified against the dependency order;
4. no `auth.role()`;
5. no dynamic SQL unless separately reviewed;
6. no change to volatility/result type/signature unless explicitly approved.

## 8. Abort-first assertions

The eventual migration must abort before any security mutation if any of these fail:

1. expected SECURITY DEFINER signatures differ;
2. duplicate identity signatures exist;
3. rewritten function still has `search_path=public`;
4. rewritten body contains `auth.role()`;
5. unapproved anon/auth EXECUTE remains after ACL cutover;
6. public EXECUTE exists for non-public functions;
7. trigger attachment/enablement changes unexpectedly;
8. `transition_event_assignment_status` signature changes;
9. `system_settings`, `activity_logs`, `auth_attempts`, `event_logs` become browser-readable;
10. canonical notification tables become browser-readable;
11. `public_application_settings` becomes writable by browser roles;
12. card sequence `2026/737/0040` is altered/reused;
13. six historical cancelled assignments are altered;
14. historical notification backfill is introduced.

## 9. Production mutation status

Production mutation: **0**

Test mutation: **0**

DDL: **0**

DML: **0**

Migration applied: **0**

Deployment: **0**

Secret reads: **0**

Provider calls: **0**

## 10. Next phase

**PHASE 1.8K — Final Migration Candidate Assembly & Static Security Test Matrix**

This phase may assemble the executable candidate SQL and static tests, but must still remain unapplied. The final migration should not be executed until the candidate passes static signature, ACL, search_path, RLS, trigger, legacy-data, and business-rule assertions.
