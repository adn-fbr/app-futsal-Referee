# Phase 1.7 Canonical Object Inventory

## Status

Inventory complete from historical SQL, generated Supabase types, frontend data access, Edge Functions, and security documents. A canonical baseline is **not created** because several security-critical definitions remain conflicting and no live non-production catalog is available.

## Evidence sources

- `supabase/migrations/*.sql` (55 historical migration files)
- `src/integrations/supabase/types.ts`
- `src/hooks/**`, `src/contexts/AuthContext.tsx`
- `supabase/functions/**`
- `docs/security/CANONICAL-RBAC-MODEL.md`
- `docs/security/CANONICAL-IDENTITY-MODEL.md`
- `docs/security/RLS-MATRIX.md`

## Application-supported public tables

The generated application contract and data-access code reference these tables:

`audit_logs`, `auth_event_logs`, `card_verification_logs`, `discussion_replies`, `discussion_topics`, `evaluation_criteria`, `evaluation_scores`, `evaluations`, `event_approvals`, `event_assignments`, `events`, `honors`, `kabupaten_kota`, `learning_materials`, `learning_progress`, `notification_preferences`, `notifications`, `pengurus`, `profiles`, `provinsi`, `referee_cards`, `referee_reviews`, `system_settings`, `user_roles`.

The previous inventory documents 22 tables; the list above contains 24 names because the generated type contract also includes the two logging/card-support tables. This count discrepancy itself requires catalog confirmation before baseline publication.

## Views and RPC surface

Generated types expose these views: `public_system_settings`, `active_events`, `active_honors`, `active_profiles`, `referee_review_stats`.

Generated types and application code expose RPC candidates including `auto_mark_expired_cards`, `can_access_region`, `check_duplicate_event`, `count_referee_cards`, `count_referees`, `generate_card_number`, `get_admin_dashboard_summary`, `get_audit_logs`, `get_pending_registrations`, `get_public_referee`, `get_public_referees`, `get_referee_event_count`, `get_referee_income_summary`, `get_referees`, `get_registration_history`, `get_user_kabupaten_kota_id`, `has_role`, `increment_view_count`, `is_admin`, `is_admin_kab_kota`, `is_admin_provinsi`, `is_evaluator`, `search_referee_cards`, and `verify_referee_card`.

Historical SQL contains additional helper, trigger, reporting, assignment, audit, and validation functions. Their final signatures and bodies require a live catalog or reviewed dump comparison.

## Object inventory and canonical confidence

| Object / class | First historical definition | Subsequent definitions | Application/security evidence | Canonical candidate | Confidence |
| --- | --- | --- | --- | --- | --- |
| `public.app_role` enum | Legacy base: `admin`, `referee` | Pg-dump recreates it with `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, `evaluator`; later migration adds values | Generated types and shared Edge authorization use the five newer roles; security docs call legacy values historical | Five-role enum, with legacy mapping decision still required | Medium |
| `public.pengurus_level` enum | Pg-dump | Later regional migrations guard/create related type | Generated types expose `PROVINSI`, `KAB_KOTA` | Two-value enum | Medium |
| `profiles` | Legacy base | Pg-dump and later regional/profile migrations add columns and constraints | Auth context, hooks, functions, and types depend on it; `kabupaten_kota_id` is the effective tenant scope | Current expanded profile table | Medium |
| `user_roles` | Legacy base | Pg-dump replay, email/role updates, policy rewrites | Auth context and every privileged Edge Function resolve roles here | Current role table with canonical five roles; legacy storage policy unresolved | Medium |
| `events` | Legacy base | Pg-dump and many column, constraint, and policy changes | Main app workflow and security fixtures depend on event tenant fields | Current event table with regional scope | Medium |
| `event_assignments` / `honors` | Legacy base | Pg-dump and later workflow changes | Hooks, Edge Functions, and generated types depend on both | Current expanded workflow tables | Medium |
| Regional tables | Pg-dump: `provinsi`, `kabupaten_kota`, `pengurus` | Later policy and data migrations | `useOrganization`, profile queries, and Edge Functions use them | Current regional hierarchy | Medium |
| Reviews/evaluations | Early review migration, dump, later evaluation migrations | Views, scores, criteria, and policy changes | Generated types and hooks use reviews/evaluations | Current review/evaluation set | Medium |
| Learning/discussion/notification tables | Later feature migrations | Later policy/column changes | Hooks and generated types use them | Existing application tables only; no new entities | Medium |
| Cards and verification logs | Later card migrations | Function/trigger/policy updates | Card hooks, RPCs, generated types | Current card subsystem | Medium |
| `system_settings` / public settings view | Settings migrations | Phase 1.4 boundary changes policies/view | Frontend reads filtered view; server functions read secrets | Table plus filtered security-invoker view | Medium |
| Functions | Legacy base, dump, later replacements | Many `DROP FUNCTION` / `CREATE OR REPLACE` operations | Generated RPC types and Edge Functions depend on selected signatures | Latest compatible definitions, not provable without catalog | Low/Medium |
| Views | Review migration, dump, later drop/recreate migrations | Public/active views replaced | Frontend and generated types depend on names | Latest security-invoker-compatible definitions | Medium |
| Triggers | Legacy base and dump | Timestamp, auth, audit, card trigger changes | Signup and audit behavior depends on exact trigger set | One intended trigger per event | Low |
| Indexes/constraints/FKs | Base, dump, and later alterations | Checks, FKs, unique constraints, indexes altered | Types and application assume relationships, but generated types are incomplete catalog evidence | Current production-compatible catalog | Low |
| RLS enablement/policies | Base and dump | Repeated policy drops/recreates and hardening migrations | RLS matrix identifies permissive and dangerous policies | Final reviewed policy set, not historical union | Low |
| Grants/roles/extensions | Dump and Supabase-managed schemas | Extension/setup declarations and grants | Supabase runtime supplies managed roles; no live catalog available | Target-project-compatible managed setup | Low |

## Important conflicts

1. `app_role` has incompatible historical value sets.
2. Tenant membership is distributed through `profiles.kabupaten_kota_id`, regional tables, and roles; there is no explicit canonical memberships table.
3. Policies are not safely composable by replay because several files reuse policy names and different authorization predicates.
4. Function signatures and bodies are replaced in multiple migrations, so latest filename is not sufficient evidence.
5. Generated types describe client expectations but do not prove constraints, grants, trigger ownership, or RLS policy definitions.

## Inventory decision

The current canonical candidate is the expanded regional application surface with five active roles and the generated table/view/RPC contract. Confidence is insufficient for SQL baseline generation because role compatibility, final policy definitions, constraints, and function bodies remain unresolved without a trusted non-production catalog.
