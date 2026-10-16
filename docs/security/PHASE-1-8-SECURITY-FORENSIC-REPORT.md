# Phase 1.8 Supabase Real Database Security Forensic Report

## Executive Summary

The authenticated Supabase CLI verified the linked project as `xfscfjwapwnkiinkgbjg` (`AFP SULSEL`), active/healthy, PostgreSQL `17.6.1.063`, region `ap-southeast-2`. The remote migration ledger contains no matching versions for the 55 local migration files, which is verified migration drift and prevents treating the repository chain as the database source of truth.

This audit performed no writes. No production-safe normal-user runtime tests were executed because no isolated test identities/environment were available. Runtime catalog values remain blocked pending completion of a schema-only export.

## Project Identity

- Project ref: `xfscfjwapwnkiinkgbjg`
- Project URL: `https://xfscfjwapwnkiinkgbjg.supabase.co`
- Name: `AFP SULSEL`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: `17.6.1.063`
- Region: `ap-southeast-2`
- Environment: `UNKNOWN`; no authoritative production/staging label was verified

## Environment Classification

UNKNOWN. The project is active and is the application-linked project. The audit did not assume production, but it also did not assume non-production. Because environment classification is unknown, no test data or user action was permitted.

## Actual Database Architecture

Runtime catalog extraction: BLOCKED at report preparation time. Repository/static evidence indicates Supabase Auth plus public profile, role, regional, event, assignment, honor, evaluation, notification, card, learning, discussion, audit, and settings tables. These are expectations, not proof of actual current catalog state.

## Authentication Model

Static code resolves identity from the bearer token through Supabase Auth and queries `user_roles`/`profiles` using the authenticated user ID. Frontend identity is not a security authority. Runtime FK relationships and orphan records are unverified.

## Canonical Role Model

Static candidate roles are `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, and `evaluator`. Historical `admin` and `referee` values remain possible. Runtime enum and assignment queries are blocked.

## Regional/Tenant Model

Static model uses `profiles.kabupaten_kota_id` plus `provinsi`/`kabupaten_kota`, with resource fields such as event `kabupaten_kota_id`. There is no verified dedicated membership table. Cross-region behavior is runtime-blocked.

## RLS Security

Historical policy review identifies broad/public and mixed-scope policy patterns, especially on reference tables, events, assignments, and settings. Actual `relrowsecurity`, `relforcerowsecurity`, and `pg_policies` values were not captured. RLS status is BLOCKED.

## SECURITY DEFINER Security

Historical SQL contains SECURITY DEFINER helpers and reporting/validation functions. Live owners, search paths, function bodies, and EXECUTE grants are unverified. Status is BLOCKED; exposed-schema definer functions and caller-supplied identity parameters are P1/P0 review targets.

## RPC Attack Surface

Static RPC candidates include role, regional, reporting, referee/card, audit, and validation functions. The actual exposed set and grants are unknown. Any sensitive SECURITY DEFINER function executable by `anon` or broad `authenticated` callers is a P0/P1 candidate pending verification.

## IDOR Analysis

Frontend and Edge Functions accept resource IDs for profiles, events, assignments, honors, evaluations, and cards. Static handlers contain several resource checks, but no production probes were run. IDOR status is BLOCKED.

## Identity Spoofing

The shared Edge resolver obtains identity from the bearer token, which is a positive static control. Request bodies still include target `user_id`, role, and regional identifiers in multiple handlers; resource authorization must be verified per function. Runtime spoofing tests are BLOCKED.

## Role Escalation

Static privileged handlers use canonical role checks. Role assignment and database-level mutation protections are unverified. Runtime role escalation is BLOCKED.

## Cross-Region Isolation

Static policy and handler evidence is mixed; the RLS matrix classifies events/assignments as dangerous or partially scoped. No cross-region runtime test was performed. Status is BLOCKED.

## Audit Log Integrity

Historical migrations define audit/auth logging tables and policies, but actual INSERT/UPDATE/DELETE privileges, triggers, and definer context are unverified. Status is BLOCKED.

## Trigger Security

Historical trigger inventory includes signup, timestamps, audit, honor, assignment, approval, and card behavior. Actual trigger set and function security context are unverified.

## View Security

The repository expects active/public/review views and a Phase 1.4 security-invoker public settings view. Actual view definitions and invoker behavior are unverified. Views bypassing RLS or exposing cross-region data are P1 review targets.

## Migration Drift

**Verified dangerous drift:** 55 local migrations show no matching remote versions in `supabase migration list --linked`. The actual database lineage is unknown. Do not repair or pull during this forensic audit.

## Critical Findings

- **P1:** Environment classification is UNKNOWN; production-safe runtime testing cannot be authorized.
- **P1:** Remote migration ledger does not match the 55 local historical migrations.
- **P1:** Actual RLS, function privileges, and policy catalog are not yet evidenced.

## P0 Findings

No P0 vulnerability was verified because no runtime catalog or normal-user exploit test was completed. This is not a clean bill of health; the P0-sensitive controls remain BLOCKED.

## P1 Findings

1. Migration-ledger/schema lineage drift.
2. Unknown environment classification.
3. Potential broad SECURITY DEFINER/RPC exposure requiring catalog verification.
4. Potential cross-region policy gaps identified statically.
5. Secret/settings boundary cannot be runtime-verified.

## P2 Findings

1. Documentation and generated types may not reflect the active database.
2. Auth hardening and managed extension/grant placement require catalog evidence.
3. Audit trigger and immutability posture requires verification.

## Evidence

- `supabase projects list --output json` verified project ref, name, status, region, and PostgreSQL version.
- `supabase migration list --linked` connected read-only and showed 55 local versions with empty remote values.
- Local migration SQL, generated Supabase types, frontend hooks, Edge Functions, and security documents were inspected.
- No write command, migration application, fixture insertion, role/policy/function change, or destructive command was executed.

## Unknowns

Actual tables, columns, constraints, indexes, enum values, role rows, RLS flags/policies, views, triggers, SECURITY DEFINER definitions, owners, search paths, EXECUTE grants, Auth configuration, and data relationships remain unknown until schema metadata is successfully exported.

## Blocked Tests

Normal-user RLS, IDOR, identity spoofing, role escalation, cross-region, service-role boundary, scheduler, and audit-integrity tests require isolated non-production identities. They were not run against the active project.

## Recommended Remediation Sequence

1. Finish a read-only schema/catalog export and preserve it outside production.
2. Classify the project environment with the owner before any runtime identity testing.
3. Reconcile actual catalog against migration SQL and the generated contract.
4. Establish an isolated non-production clone/baseline.
5. Run normal-user security tests there.
6. Only after evidence, design remediation migrations; do not remediate in this audit.

## Canonical Security Model

Provisional only: Auth user ID -> profile -> database role rows -> regional scope -> Edge Function resource authorization -> RLS. Frontend guards are UX-only. The model is not approved until live catalog and policy evidence confirms it.

## Gate Decision

**BLOCKED.** The real project identity is verified, but runtime catalog and production-safe security testing are incomplete. Migration drift is verified. No Phase 1 security PASS is permitted.
