# Phase 1.8E.4 Canonical Runtime Baseline Specification

## Status

**SPECIFICATION READY; BASELINE ARTIFACT NOT CREATED; DEPLOYMENT BLOCKED.**

## 1. Scope

Reproduce the audited production runtime schema in the isolated Supabase test project `shorsqyycpptxcutrqrb`, with zero production rows, users, secrets, or storage objects. This phase reproduces observed behavior; remediation is deferred.

## 2. Source of truth

Primary source: Phase 1.8B production schema-only catalog, 113,595 bytes, containing 27 public tables, 3 views, 47 functions, 41 SECURITY DEFINER functions, 86 policies, 5 `app_role` values, and RLS enabled on all 27 public tables.

Secondary sources: generated application types, frontend hooks, Edge Functions, and runtime relationship evidence. Local 55-migration history is archival evidence only and must not be replayed.

## 3. Object inventory

### Tables

`events`, `honors`, `activity_logs`, `audit_logs`, `auth_attempts`, `auth_event_logs`, `card_verification_logs`, `discussion_replies`, `discussion_topics`, `evaluation_criteria`, `evaluation_scores`, `evaluations`, `event_approvals`, `event_assignments`, `event_logs`, `kabupaten_kota`, `learning_materials`, `learning_progress`, `notification_preferences`, `notifications`, `pengurus`, `profiles`, `provinsi`, `referee_cards`, `referee_reviews`, `system_settings`, and `user_roles`.

### Views

`active_events`, `active_honors`, and `referee_review_stats`, all observed as security-invoker views.

### Enums

- `public.app_role`: `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, `evaluator`.
- `public.pengurus_level`: `PROVINSI`, `KAB_KOTA`.

### Functions

47 public functions, including role, region, reporting, card, honor, assignment, audit, validation, trigger, and timestamp functions. 41 are SECURITY DEFINER. Exact signatures and definitions must be imported from the reviewed schema-only source, not reconstructed by hand.

### RLS and policies

RLS enabled on all 27 public tables; 86 policies. Preserve observed policy expressions, including broad `USING (true)`/`WITH CHECK (true)` policies, without silently tightening them.

### Triggers, indexes, constraints

Reproduce the catalog-documented trigger, index, primary-key, foreign-key, unique, and check-constraint definitions. Runtime relationship evidence includes Auth-to-profile/role links, regional hierarchy, event scope, assignment, honor, evaluation, card, notification, and audit relationships.

## 4. SECURITY DEFINER inventory

Review all 41 functions before generating executable SQL. Required review fields: signature, owner, search path, security mode, EXECUTE privileges, `auth.uid()` use, caller identity/role/region parameters, dynamic SQL, sensitive reads/mutations, RLS interaction, policy/trigger callers, and known unsafe constructs. The catalog shows `search_path = public` for inspected functions; exact owner and ACL evidence remains incomplete.

## 5. Role model

Roles are application enum values, not PostgreSQL login roles. Do not create global PostgreSQL roles for them. Reproduce only the `app_role` enum and its dependent schema.

## 6. Known unsafe production constructs

Document without remediation: broad table grants to `anon`/`authenticated`/`service_role`; broad public/reference policies; 41 SECURITY DEFINER functions; `search_path = public` without explicit `pg_temp`; and unresolved function EXECUTE ACL details. These are baseline findings for later security remediation.

## 7. Intentionally excluded

All table rows, Auth users/identities/sessions, storage buckets/objects, settings data, production secrets, API keys, credentials, sessions, tokens, and production external integrations.

## 8. Deployment order

1. Verify target ref and empty state.
2. Install required extensions.
3. Create enums/types.
4. Create tables and columns.
5. Add constraints and indexes.
6. Create helper/domain functions in dependency order.
7. Create triggers.
8. Create security-invoker views.
9. Enable RLS.
10. Create policies.
11. Apply reviewed grants and function privileges.
12. Verify schema and security equivalence.

## 9. Verification strategy

Capture a target schema-only catalog and compare every object to production: `MATCH`, `MISSING`, `EXTRA`, `DIFFERENT`, or `INTENTIONALLY DIFFERENT`. Counts alone are insufficient. Verify zero rows/Auth/storage state separately.

## 10. Rollback strategy

No production rollback exists because production is untouched. If test deployment fails, destroy/reset only the isolated test project after target-ref preflight, or provision a fresh test project. Do not drop individual objects to force completion.

## 11. Current blocker

An executable baseline migration is not created because the source requires review of exact function definitions/ACLs and the target SQL identity/catalog remains incomplete. Creating speculative SQL would violate the baseline reconstruction rule.
