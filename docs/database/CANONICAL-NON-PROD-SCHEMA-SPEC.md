# Canonical Non-Production Schema Specification

## Status

**Proposed, not approved.** This is the target specification assembled from application evidence. It is not a baseline SQL artifact and must not be applied until the decision blocker is resolved.

## Identity

```text
auth.users
  -> public.profiles (one-to-one by id)
  -> public.user_roles (zero or more role rows)
  -> profiles.kabupaten_kota_id / regional hierarchy
```

Supabase Auth is the identity source. `profiles` is the application profile. `user_roles` is the current role source. Effective tenant context is currently represented by `profiles.kabupaten_kota_id` and `provinsi`/`kabupaten_kota`, not by a dedicated membership table.

## Authorization

The application evidence supports these active role values:

- `admin_provinsi`: platform-wide administration.
- `admin_kab_kota`: regional administration.
- `panitia`: competition/event operations.
- `wasit`: referee operations.
- `evaluator`: assessment operations.

Historical `admin` and `referee` values are legacy candidates and require an explicit compatibility/migration decision. Client-provided identity, role, and tenant values are not authoritative.

## Supported current domain entities

Only entities evidenced by generated types, migrations, hooks, or Edge Functions are included:

- identity/profile: `profiles`, `user_roles`
- regional organization: `provinsi`, `kabupaten_kota`, `pengurus`
- events and workflow: `events`, `event_assignments`, `event_approvals`, `honors`
- reviews/evaluation: `referee_reviews`, `evaluation_criteria`, `evaluations`, `evaluation_scores`
- learning/community: `learning_materials`, `learning_progress`, `discussion_topics`, `discussion_replies`
- notifications: `notifications`, `notification_preferences`
- referee identity artifacts: `referee_cards`, `card_verification_logs`
- security/audit/configuration: `audit_logs`, `auth_event_logs`, `system_settings`

The repository does not provide sufficient evidence for separate `competition`, `season`, `team`, `match`, `match_events`, or `match_reports` entities. They are not added to this specification.

## Database security target

- RLS enabled on every exposed security-sensitive public table.
- Policies explicitly constrain actor identity, role, regional/tenant scope, ownership, and operation.
- `system_settings` is not browser-readable for secret keys; the public settings view is security-invoker and filtered.
- `SECURITY DEFINER` functions are limited to required helpers, use a fixed `search_path`, validate inputs, and have tested caller boundaries.
- Service-role access is server-only and never exposed to browser clients.
- Grants and managed Supabase roles are verified against the target project catalog.

## Approval status by area

| Area | Evidence | Status |
| --- | --- | --- |
| Auth/profile relationship | Auth context, migrations, identity model | Candidate identified |
| Active role vocabulary | Generated types, shared resolver, app code | Candidate identified; legacy mapping unresolved |
| Tenant boundary | Profiles and regional queries | Candidate identified; membership semantics unresolved |
| Table/view/RPC names | Generated types and hooks | Candidate identified |
| Final columns/defaults/constraints | Conflicting migrations only | Unresolved |
| Final function bodies/signatures | Replacements across history | Unresolved |
| Final RLS policy set | Repeated policy rewrites and RLS matrix | Unresolved |
| Grants/extensions/triggers | No live catalog | Unresolved |

## Baseline decision

This specification cannot yet become the canonical baseline because the unresolved items are security- and compatibility-critical. Approval requires a trusted non-production catalog or reviewed schema snapshot and explicit decisions on legacy roles, tenant membership semantics, final policies, and function definitions.
