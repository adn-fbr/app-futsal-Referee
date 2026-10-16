# PHASE 1.3 — Migration SQL Draft & Rollback Plan

**Project:** AFP SULSEL  
**Environment:** Production (`xfscfjwapwnkiinkgbjg`)  
**Mode:** READ-ONLY / DRAFT ONLY  
**Date:** 2026-09-24  
**Gate:** BLOCKED — execution not authorized and contracts remain incomplete

## 1. Objective

Convert the Phase 1.2 security findings into an executable migration design without applying any production change.

## 2. Evidence used

Current production inspection confirms 42+ `SECURITY DEFINER` functions in `public` with broad effective EXECUTE exposure and `search_path=public`. Selected function bodies also show authorization and data-exposure concerns requiring contract-specific treatment.

High-risk examples:

- `get_public_referee` / `get_public_referees`: bounded public read candidates.
- `verify_referee_card`: anonymous mutating verification RPC; requires strict public-output and abuse controls.
- `get_referees`: uses deprecated `auth.role()` logic and returns profile fields; requires authenticated/public contract separation.
- `get_user_kabupaten_kota*`: arbitrary `_user_id` lookup; must not remain an unrestricted identity/region oracle.
- `get_admin_dashboard_summary`: nullable region scope can produce all-region summaries; authorization must be explicit.
- `get_audit_logs`: returns sensitive audit payloads and must be restricted to authorized administrators.
- `transition_event_assignment_status`: authorization and transition invariants must be preserved while hardening the function.
- `generate_card_number`: remains privileged/internal and has a concurrency design issue to resolve with the Phase 1.5 card-counter candidate.

## 3. Migration design

### A. EXECUTE privilege boundary

1. Revoke `EXECUTE` from `PUBLIC` for SECURITY DEFINER functions.
2. Explicitly grant `anon` only to verified public RPCs.
3. Explicitly grant `authenticated` only to application RPCs whose caller contract is complete.
4. Keep administrative/internal/trigger functions out of direct browser RPC access.
5. Never restore access with a blanket `GRANT EXECUTE ON ALL FUNCTIONS`.

### B. SECURITY DEFINER hardening

Target pattern:

```sql
SET search_path = '';
```

Every application relation, type, and callable dependency must then be schema-qualified. The 42+ functions must be handled in dependency order, not with an unsafe bulk text replacement.

### C. RLS

No blind policy recreation is authorized. The following require semantic completion:

| Object | Contract required |
|---|---|
| `activity_logs` | private/internal access |
| `auth_attempts` | private/internal access |
| `event_logs` | private/internal access |
| `system_settings` | private; no browser direct access |
| `event_approvals` | determine whether any public read is intentional |
| `referee_reviews` | anti-abuse + ownership/field validation |
| `profiles` | public projection vs full-row exposure |
| `events` | public fields and lifecycle visibility |
| `event_assignments` | preserve ownership + admin regional rules |

### D. Public settings

`system_settings` must not be reopened to the browser. Public-safe settings remain exposed through `public_application_settings`; writes remain server-side through the authenticated Edge Function.

### E. Trigger preservation

Trigger functions are not browser APIs. Revoking direct EXECUTE does not mean disabling their trigger execution. All user-defined triggers must remain enabled and attached to their current tables/events unless a separate business-rule decision authorizes a change.

## 4. Preflight gates before execution

Phase 1.4 must establish:

- exact function signatures and return types;
- exact pre-migration EXECUTE grants for every affected function;
- complete caller inventory from application code and Edge Functions;
- dependency-safe ordering for SECURITY DEFINER hardening;
- schema-qualified references after `search_path=''`;
- complete RLS `USING` + `WITH CHECK` semantics for writes;
- explicit `TO anon` / `TO authenticated` targeting;
- no browser path to `system_settings` secrets;
- trigger inventory consistency (current evidence has a count discrepancy that must be reconciled);
- migration lineage and absence of replay of the historical `canonical_baseline_reconstruction` artifact;
- contract tests for public RPCs and authenticated role/region isolation.

## 5. Rollback plan

Rollback is privilege restoration plus function-definition restoration from an immutable pre-change snapshot. It must be exact, not broad.

Required snapshot artifacts:

1. `pg_get_functiondef()` for every changed function.
2. `proacl` for every changed function.
3. RLS policy definitions and role targets for every changed table.
4. Trigger definitions and enablement state.
5. Relevant grants on affected tables/functions.
6. Migration version and deployment timestamp.

Rollback order:

1. Stop application deployment using the changed contract.
2. Restore function definitions in reverse dependency order.
3. Restore exact function ACLs.
4. Restore exact RLS policies/ACLs.
5. Verify triggers remain enabled.
6. Run post-rollback authorization and public-surface tests.

## 6. Explicit non-actions

This Phase 1.3 artifact does **not**:

- apply SQL to Production;
- alter RLS policies;
- alter function definitions;
- revoke or grant live privileges;
- deploy Edge Functions;
- modify data;
- read secrets.

## 7. Gate decision

**BLOCKED / DRAFT COMPLETE.**

The migration design is sufficiently concrete to proceed to **PHASE 1.4 — Migration Static Validation & Contract Verification**, but execution remains blocked until the exact function ACL snapshot, caller inventory, RLS semantic contracts, trigger-count discrepancy, and Phase 1.5 schema/business-rule completion are closed.
