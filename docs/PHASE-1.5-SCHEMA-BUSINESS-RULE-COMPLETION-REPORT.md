# PHASE 1.5 — Schema & Business-Rule Completion

**Project:** AFP SULSEL  
**Production:** `xfscfjwapwnkiinkgbjg`  
**Test:** `shorsqyycpptxcutrqrb`  
**Date:** 2026-09-24  
**Mode:** READ-ONLY  
**Gate:** **BLOCKED — SCHEMA/BUSINESS-RULE COMPLETION INCOMPLETE**

## 1. Objective

Freeze the canonical schema and business contracts for the eight test-only application tables classified as `CANONICAL_CANDIDATE`, and determine whether they can safely become part of the production canonical baseline.

No DDL, DML, migration application, deployment, or production mutation was performed.

## 2. Canonical candidates inspected

1. `assignment_notifications`
2. `event_completion_notifications`
3. `message_delivery_ledger`
4. `meta_webhook_events`
5. `notification_channel_claims`
6. `public_application_settings`
7. `referee_card_counters`
8. `referee_contacts`

Production currently has none of these eight tables in `public`.

## 3. Structural evidence from Test

### assignment_notifications
- Primary key: `id`
- Unique: `assignment_id`
- FK: `assignment_id -> event_assignments(id) ON DELETE CASCADE`
- Status checks: email and WhatsApp each constrained to `pending/sent/failed/skipped`
- Provider check: `NULL`, `meta`, or `kirisan`
- Important indexes: assignment id and WhatsApp request id.

**Business contract:** one notification ledger per assignment; email/WhatsApp lifecycle must remain independently idempotent.

### event_completion_notifications
- Primary key: `id`
- Unique identity: `(event_id, referee_id, channel)`
- FK: event and referee
- Channel: `email` or `whatsapp`
- Status: `pending/sent/failed/skipped`
- Claim tuple must be all-null or all-populated.
- Claim expiry cannot precede claim time.
- Partial unique claim index prevents duplicate active claim IDs.

**Business contract:** completion notification intents are unique per event/referee/channel and use expiring claims for concurrency control.

### message_delivery_ledger
- Primary key: `id`
- Provider constrained to `kirisan`
- Environment constrained to `test/production`
- `production` boolean must equal environment semantics.
- Event type currently constrained to `send_status`.
- Normalized status: `sent/failed/unknown`.
- Unique idempotency key.
- Unique provider/environment/event-type/request-id tuple.

**Business contract:** provider delivery evidence is append-oriented and idempotent; environment identity cannot contradict the boolean marker.

### meta_webhook_events
- Primary key: `id`
- Provider constrained to `meta`
- Lifecycle status: `sent/delivered/read/failed`
- Unique `event_key`
- Unique canonical Meta identity tuple `(provider,waba_id,phone_number_id,wamid,lifecycle_status,provider_event_timestamp)`.

**Business contract:** webhook events must be deduplicable both by application event key and canonical provider identity.

### notification_channel_claims
- Composite primary key `(assignment_id, channel)`
- Channel: `email/whatsapp`
- Unique `claim_id`
- Expiry must be >= claim time
- FK to `event_assignments` with cascade delete.

**Business contract:** at most one claim row exists for an assignment/channel; expired claims may be replaced atomically.

### public_application_settings
- Primary key: `key`
- `value` nullable
- Authenticated SELECT only in Test.
- Service role manages the table.

**Business contract:** browser-readable configuration must remain limited to the explicit public-safe allowlist. This table must not become a backdoor for secrets or arbitrary settings.

### referee_card_counters
- Composite primary key `(year, region_code)`
- `last_sequence` defaults to 0.
- Intended as the atomic sequence allocator for referee-card numbers.

**Business contract:** card numbering must be concurrency-safe; `MAX()+1` allocation must not remain the canonical allocator.

### referee_contacts
- Primary key: `id`
- Unique `referee_id`
- FK to `profiles(id) ON DELETE CASCADE`
- WhatsApp number format constrained to `62` followed by 9–13 digits.
- Referee-only read/insert/update policies are present.

**Business contract:** one WhatsApp contact per referee, owned by that referee, with normalized Indonesian-number format.

## 4. Test function dependency evidence

The following Test functions directly depend on these canonical candidates:

- `claim_event_completion_notification`
- `claim_notification_channel`
- `create_event_completion_notification_intents` (trigger function)
- `finalize_event_completion_notification`
- `finalize_notification_channel`
- `bulk_issue_referee_cards`
- `issue_my_referee_card`
- `issue_referee_card_for_admin`

The notification claim/finalization functions are already hardened with `search_path=''` or restricted `search_path` variants. Their direct browser EXECUTE exposure is currently absent in Test, while the two card issuance application RPCs are authenticated-only.

This is materially stronger than the current Production pattern, where many SECURITY DEFINER functions remain executable by both `anon` and `authenticated`.

## 5. Important schema/business-rule findings

### A. Card sequence allocator
`referee_card_counters` provides an atomic allocator using `INSERT ... ON CONFLICT ... DO UPDATE`, eliminating the concurrency weakness identified in Production `generate_card_number`, which currently calculates the next number with `MAX()+1`.

**Required completion:** freeze the allocator contract and migrate card issuance functions to it before treating the counter as production-canonical.

### B. Notification claim model
The combination of `notification_channel_claims`, `assignment_notifications`, and the claim/finalize RPCs establishes a transactional ownership protocol for email/WhatsApp delivery.

**Required completion:** freeze caller authorization and provider-boundary contracts before exposing any of these RPCs to application roles.

### C. WhatsApp contact boundary
`referee_contacts` is a dedicated personal-contact table with referee ownership. This is preferable to reintroducing WhatsApp credentials into `system_settings` or browser-readable settings.

**Required completion:** verify all callers use this table and that no legacy code still reads a secret-bearing settings key.

### D. Public settings boundary
`public_application_settings` is currently readable by `authenticated` only. The production-safe architecture requires explicit public-safe keys and server-side writes. The existing safe-settings allowlist must remain authoritative.

**Required completion:** verify exact key/value contents, grants, and Edge Function write path before production introduction.

### E. Provider delivery/webhook ledgers
`message_delivery_ledger` and `meta_webhook_events` encode provider-specific idempotency and lifecycle semantics. They should not be collapsed into generic settings or notification tables.

**Required completion:** freeze retention, privacy, webhook authenticity, and provider event replay/idempotency rules.

## 6. RLS and privilege status

`public_application_settings` has an authenticated read policy and service-role management policy.

`referee_contacts` has ownership policies, including both `USING` and `WITH CHECK` on update.

The other six canonical candidate tables currently have no Test RLS policies in the inspected catalog. Because they are internal ledgers/claim tables, they should not automatically receive permissive browser policies. Their intended access path should be server-side privileged functions/Edge Functions, with direct `anon` and `authenticated` table access explicitly denied or otherwise proven necessary.

This is a **design requirement**, not a change performed in Phase 1.5.

## 7. Production parity assessment

Production currently lacks the eight candidate tables. Therefore direct schema parity cannot be declared.

Production does, however, already contain business functionality related to referee cards, assignments, events, honors, and public verification. The canonical candidates must be integrated without weakening those existing contracts.

In particular:

- `event_assignments` is high-coupling and already protected by RLS, triggers, and status-transition logic.
- `referee_cards` already has lifecycle behavior and verification functionality.
- `system_settings` must remain private.
- Existing public verification must not gain access to internal provider credentials or internal ledger rows.

## 8. Required completion matrix

| Area | Status | Required before execution |
|---|---|---|
| Candidate table definitions | PARTIAL | Freeze exact production migration definitions |
| PK/UNIQUE/FK/check constraints | PASS for Test evidence | Verify production dependency order |
| Indexes | PASS for Test evidence | Freeze only required indexes |
| Triggers | PARTIAL | Confirm all candidate trigger attachments and timing |
| RLS | BLOCKED | Define least-privilege role matrix for internal ledgers |
| Function callers | BLOCKED | Map every caller and required Postgres role |
| SECURITY DEFINER | BLOCKED | Freeze auth, search_path, and output contracts |
| Card counter migration | BLOCKED | Reconcile existing cards/counters and allocator semantics |
| Public settings | BLOCKED | Freeze allowlist + server write path |
| WhatsApp contacts | BLOCKED | Verify application callers and privacy boundary |
| Kirisan ledger | BLOCKED | Freeze provider/event/idempotency contract |
| Meta webhook ledger | BLOCKED | Freeze authenticity/replay contract |
| Data migration | NOT STARTED | Must include explicit preservation/idempotency plan |
| Production deployment | NOT AUTHORIZED | Requires later gate approval |

## 9. Phase 1.5 blockers

1. **Production schema completion is not yet drafted from a fully frozen contract.**
2. **Internal candidate tables need an explicit direct-access policy:** server-only versus authenticated application access.
3. **Caller authorization for notification claim/finalize functions is not yet frozen.**
4. **Card issuance must be reconciled with existing Production card data and the new atomic counter.**
5. **`public_application_settings` requires an exact production-safe key inventory and migration strategy.**
6. **Webhook/provider ledgers require explicit authenticity, replay, retention, and idempotency rules.**
7. **Production SECURITY DEFINER hardening remains incomplete.**
8. **The four existing zero-policy internal Production tables remain unresolved:** `activity_logs`, `auth_attempts`, `event_logs`, `system_settings`.
9. **High-risk existing public policies remain unresolved:** `event_approvals`, `events`, `profiles`, and `referee_reviews`.

## 10. Safety counters

- Production DDL: **0**
- Production DML: **0**
- Test DDL: **0**
- Test DML: **0**
- Migration applied: **0**
- Deployment: **0**
- Secret reads: **0**

## 11. Gate decision

### **PHASE 1.5 — BLOCKED**

The eight Test-only tables have enough structural evidence to be treated as serious canonical candidates, but the production schema/business-rule contract is not yet complete enough for migration execution.

**No migration should be applied to Test or Production at this point.**

## 12. Next phase

**PHASE 1.6 — Canonical Production Schema Integration Plan & Execution Preconditions**

The next phase should freeze:

1. exact DDL for the eight candidate tables;
2. dependency ordering;
3. direct table grants/RLS model;
4. function EXECUTE matrix;
5. SECURITY DEFINER/search_path requirements;
6. card-counter reconciliation and allocator transition;
7. public settings seed/allowlist contract;
8. Kirisan/Meta ledger privacy and idempotency contract;
9. rollback/data-preservation strategy;
10. test-only rehearsal assertions.

**Execution remains unauthorized until those contracts pass review.**
