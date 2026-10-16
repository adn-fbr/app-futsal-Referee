# Phase 1.8 RBAC Forensic Audit

## Status

**RUNTIME BLOCKED; STATIC EVIDENCE AVAILABLE.** No role rows or live enum catalog values were queried or modified.

## Identity and role candidates

Static application and Edge Function code resolve the authenticated user through Supabase Auth, then query `public.user_roles` by `auth.users.id` and `public.profiles` by the authenticated ID. The shared resolver accepts only: `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, and `evaluator`.

Historical migrations also contain legacy `admin` and `referee` values. Their presence in the real database is unknown because no live role query was performed.

| Role | Static meaning | Assignment mechanism | Regional scope | Escalation concern |
| --- | --- | --- | --- | --- |
| `admin_provinsi` | platform administration | `user_roles` / privileged handlers | global | role assignment and target checks require runtime verification |
| `admin_kab_kota` | regional administration | `user_roles` / privileged handlers | profile region | cross-region predicates require runtime verification |
| `panitia` | event/competition operations | `user_roles` | event/region dependent | resource ownership requires runtime verification |
| `wasit` | referee operations | `user_roles` | own/referee assignment dependent | IDOR and assignment scope require runtime verification |
| `evaluator` | evaluation operations | `user_roles` | evaluation/resource dependent | evaluator resource scope requires runtime verification |
| `admin` | legacy historical role | historical migration | unknown | role drift / ambiguous authorization |
| `referee` | legacy historical role | historical migration | unknown | role drift / ambiguous authorization |

## Findings

- **P1 / runtime blocked:** exact enum values and live assignments are unknown.
- **P1 / static:** role source is database-backed, but tenant membership is distributed through profile/regional fields rather than a single membership relation.
- **P0 test blocked:** self-assignment, role update, and SECURITY DEFINER escalation cannot be safely tested against the active project without production test identities.

## Required read-only queries when catalog access is available

Inspect `pg_type`, `pg_enum`, `user_roles` metadata only through an approved read-only channel. Do not expose role assignment PII in reports. Verify unknown values, duplicate assignments, orphan references, and grants.

## Decision

Canonical RBAC is **BLOCKED** for runtime approval. Static candidate: the five-role resolver vocabulary; legacy mapping remains unresolved.
