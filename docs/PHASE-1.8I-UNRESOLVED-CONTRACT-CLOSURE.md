# PHASE 1.8I — Unresolved Contract Closure & Source-to-RPC Evidence Reconciliation

Date: 2026-09-24
Mode: READ-ONLY
Project: AFP SULSEL (`xfscfjwapwnkiinkgbjg`)

## Gate

**BLOCKED — deny-by-default closure achieved for unresolved privileged RPCs, but executable rewrite remains blocked pending application contract decisions.**

No Production/Test mutation, DDL, DML, migration application, deployment, or provider call was performed.

## 1. Live Production evidence

The following SECURITY DEFINER functions were inspected directly from `pg_proc`:

- `count_referees(text, boolean, uuid, text)`
- `get_admin_dashboard_summary(uuid, date, date)`
- `get_honor_statistics(uuid)`
- `get_referee_event_count(uuid, date, date)`
- `get_referee_income_summary(uuid, date, date)`
- `get_referees(text, boolean, uuid, text, integer, integer)`
- `soft_delete_record()`

All remain `SECURITY DEFINER` with `search_path=public` in the live Production catalog.

### 1.1 `soft_delete_record()`

Live definition:

- return type: `trigger`
- no non-internal trigger attachment was found
- body only sets `NEW.deleted_at = now()` and returns `NEW`
- no proven application caller was found in source/library searches

Decision: **UNRESOLVED/ORPHANED INTERNAL FUNCTION — deny direct browser execution.**
It must not be assumed to be trigger-only until a future schema/source reconciliation proves an attachment. If no legitimate use is found, the final migration may safely remove direct `anon`/`authenticated` execution while preserving the function itself for rollback compatibility.

### 1.2 `get_honor_statistics(uuid)`

Current function accepts arbitrary `_referee_id`, including NULL, and returns financial aggregates (`total_earned`, `pending_amount`).

No verified direct browser caller contract was established.

Decision: **DENY anon + authenticated.**
Future browser access, if required, should use a self-bound RPC based on `auth.uid()` and a separately authorized admin reporting RPC.

### 1.3 `get_admin_dashboard_summary(uuid,date,date)`

Current function permits `_kabupaten_kota_id IS NULL`, producing all-region aggregate results. Output includes referee counts, event counts and verified/pending income.

No verified caller contract establishes who may request NULL/all-region scope.

Decision: **DENY anon + authenticated until explicit admin role and scope contract is implemented.**

### 1.4 `get_referee_income_summary(uuid,date,date)`

Current function permits arbitrary region and NULL/all-region selection and returns referee-level financial aggregates.

No verified direct browser authorization contract was established.

Decision: **DENY anon + authenticated.**

### 1.5 `get_referee_event_count(uuid,date,date)`

Current function permits arbitrary region selection and returns referee-level activity aggregates.

No verified direct browser authorization contract was established.

Decision: **DENY anon + authenticated.**

### 1.6 `count_referees(text,boolean,uuid,text)`

Current body contains the deprecated `auth.role()` pattern and a public fallback:

`auth.role() = 'authenticated' OR p.is_active = true`

Decision: **DENY anon + authenticated until rewritten as an explicit authorized reporting function.**

### 1.7 `get_referees(...)`

Current body contains the same deprecated `auth.role()` plus public active-referee fallback and exposes multiple profile fields.

Decision: **DENY anon + authenticated in the final boundary until the function is rewritten with explicit authorization and safe projection.**

## 2. Source-to-RPC reconciliation

Searches were performed for the unresolved function names and `supabase.rpc(...)` usage. No authoritative source caller was established for the unresolved reporting functions.

This is treated as **absence of verified evidence**, not proof of absence.

Therefore the security decision is deny-by-default rather than inventing an application requirement.

## 3. Dependency safety

`has_schedule_conflict(uuid,uuid)` remains internal because `validate_referee_assignment()` depends on it. Its browser EXECUTE must remain denied without disabling the trigger path.

The same principle applies to trigger functions: ACL hardening must not disable trigger execution.

## 4. Final unresolved-contract table

| Function | Browser execution | Required future action |
|---|---|---|
| `soft_delete_record()` | DENY | Prove trigger/caller or retire safely |
| `get_honor_statistics()` | DENY | Split self-statistics/admin-statistics contract |
| `get_admin_dashboard_summary()` | DENY | Explicit admin + region/all-region authorization |
| `get_referee_income_summary()` | DENY | Explicit admin/regional authorization |
| `get_referee_event_count()` | DENY | Explicit admin/regional authorization |
| `count_referees()` | DENY | Remove `auth.role()`, explicit authorization |
| `get_referees()` | DENY | Remove public fallback, explicit authorization/projection |

## 5. Phase 1.8I conclusion

The unresolved boundary has now been closed conservatively at the **authorization decision level**: no unresolved privileged function receives browser execution merely because an application caller is suspected.

However, this does **not** yet make the rewrite migration executable. Function bodies, exact caller contracts, and any replacement self/admin RPCs must be finalized before the ACL cutover and search-path rewrite can be assembled.

### Next phase

**PHASE 1.8J — Canonical Rewrite Specification & Replacement RPC Contract**

Scope:

1. freeze rewritten bodies for the two safe authenticated RPCs;
2. freeze public-safe bodies and bounded `verify_referee_card()` contract;
3. specify replacement self/admin statistics RPCs where required;
4. specify explicit admin/region authorization predicates;
5. specify `soft_delete_record()` retirement/retention treatment;
6. generate abort-first static assertions without applying them.

## Safety counters

- Production mutation: **0**
- Test mutation: **0**
- DDL: **0**
- DML: **0**
- Migration applied: **0**
- Deployment: **0**
- Provider calls: **0**
- Secret reads: **0**
