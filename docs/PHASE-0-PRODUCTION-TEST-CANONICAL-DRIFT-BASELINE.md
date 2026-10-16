# PHASE 0 — PRODUCTION ↔ TEST CANONICAL DRIFT BASELINE

## Scope and safety statement

This phase is read-only and design-only. It does not execute migration, DDL, DML, deployment, DB push, reset, or schema repair. It uses workspace evidence and prior documented preflight artifacts only.

## Evidence used

- [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md)
- [docs/PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md](PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md)
- [docs/PHASE-8.5G.2A-MIGRATION-DRIFT-REPORT.md](PHASE-8.5G.2A-MIGRATION-DRIFT-REPORT.md)
- [docs/security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md](security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md)
- [supabase/config.toml](../supabase/config.toml)
- [docs/backend/production-catalog/PRODUCTION-CATALOG-EXTRACTION.md](backend/production-catalog/PRODUCTION-CATALOG-EXTRACTION.md)

---

## A. ENVIRONMENT IDENTITY

### Verified identity

| Item | Production | Test | Evidence |
|---|---|---|---|
| Project ref | `xfscfjwapwnkiinkgbjg` | `shorsqyycpptxcutrqrb` | [docs/security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md](security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md) |
| Status | `ACTIVE_HEALTHY` / live reference | `ACTIVE_HEALTHY` | [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md) |
| PostgreSQL version | `17.6.1.063` | `17.6.1.166` | [docs/security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md](security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md) |
| Region | `ap-southeast-2` | `ap-south-1` | [docs/security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md](security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md) |
| Migration state | production catalog not directly queried; local/remote ledger drift documented | local + remote drift; remote-only `20260908085000` | [docs/PHASE-8.5G.2A-MIGRATION-DRIFT-REPORT.md](PHASE-8.5G.2A-MIGRATION-DRIFT-REPORT.md) |

### Edge Function inventory

The local function inventory is declared in [supabase/config.toml](../supabase/config.toml). The active config shows these functions and their JWT behavior:

- `create-user` — `verify_jwt = true`
- `delete-user` — `verify_jwt = true`
- `reset-user-password` — `verify_jwt = true`
- `admin-reports` — `verify_jwt = true`
- `seed-database` — `verify_jwt = true`
- `export-database` — `verify_jwt = true`
- `import-database` — `verify_jwt = true`
- `send-event-notification` — `verify_jwt = true`
- `update-user-email` — `verify_jwt = true`
- `test-email-config` — `verify_jwt = true`
- `auto-complete-events` — `verify_jwt = true`
- `send-assignment-notification` — `verify_jwt = true`
- `upsert-whatsapp-config` — `verify_jwt = true`
- `test-whatsapp-config` — `verify_jwt = true`
- `send-whatsapp` — `verify_jwt = true`
- `notification-orchestrator` — `verify_jwt = true`
- `send-profile-reminder` — `verify_jwt = true`
- `generate-report-pdf` — `verify_jwt = true`
- `send-license-reminder` — `verify_jwt = true`
- `meta-whatsapp-webhook` — `verify_jwt = false`

This is an inventory of declared auth policy, not a live deployment inventory. The repo explicitly does not treat this as literal production deployment status.

### Identity conclusion

- Production and test refs are both identified and distinct.
- The repo contains enough evidence to distinguish the two environments and to classify the drift as environment-specific, not a single shared canonical state.
- Production direct SQL access remains blocked at the evidence layer; the real production catalog is not available in this workspace and is explicitly marked blocked in [docs/backend/production-catalog/PRODUCTION-CATALOG-EXTRACTION.md](backend/production-catalog/PRODUCTION-CATALOG-EXTRACTION.md).

---

## B. MIGRATION BASELINE

### Migration ledger summary

The repository evidence shows a materially diverged migration landscape:

- Local schema history includes 55 migration files under [supabase/migrations](../supabase/migrations).
- The linked non-production project reports remote drift with remote-only version `20260908085000`.
- A recovered historical file, `tmp/d1d6-work/supabase/migrations/20260908085000_canonical_baseline_reconstruction.sql`, is classified as a destructive canonical baseline reconstruction artifact and must not be replayed.
- No production direct migration table comparison was available; the production catalog extraction is blocked.

### Migration classification table

| Version | Name | Exists Production? | Exists TEST? | Classification | Evidence |
|---|---|---|---|---|---|
| `20260103165842` | `20260103165842_remix_migration_from_pg_dump.sql` | Unverified live; historical evidence only | Local-only historical artifact | `HISTORICAL/BASELINE ARTIFACT` | [docs/PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md](PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md) |
| `20260110162455` | `20260110162455_98e87d41-5e63-4dba-9290-9fb5f39f3a12.sql` | Not proved live | Local candidate, remote absent | `REQUIRES REVIEW` | [docs/PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md](PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md) |
| `20260121161308` | `20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql` | Historical evidence only | Local historical contract conflict | `REQUIRES REVIEW` / `MIGRATION-LINEAGE-DRIFT` | [docs/PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md](PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md) |
| `20260908085000` | `canonical_baseline_reconstruction` | Not production-authorized | Remote-only drift; local source recovered in temp workdir | `HISTORICAL/BASELINE ARTIFACT` | [docs/PHASE-8.5G.2A-MIGRATION-DRIFT-REPORT.md](PHASE-8.5G.2A-MIGRATION-DRIFT-REPORT.md) |

### Important baseline rule

The recovered `20260908085000_canonical_baseline_reconstruction.sql` is not a normal migration candidate. The evidence explicitly states that it contains `DROP SCHEMA public CASCADE` and broad schema recreation and therefore must not be replayed. This is a baseline reconstruction artifact, not an approved migration lineage.

---

## C. SCHEMA INVENTORY

### Schema inventory status

This section is materially blocked from full runtime validation because the live production schema was not directly extracted and the remote non-production schema was not fully verified for all object families.

### Best available evidence

- The production catalog extraction is blocked in [docs/backend/production-catalog/PRODUCTION-CATALOG-EXTRACTION.md](backend/production-catalog/PRODUCTION-CATALOG-EXTRACTION.md).
- The non-production snapshot did show a partial schema, with 14 tables, 119 columns, 11 indexes, 32 policies, 8 triggers, 2 enum types, and 20 functions in [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md).
- The same report explicitly lists the mismatch against the canonical target: missing `events.deleted_at`, missing `events.kabupaten_kota_id`, and missing `public.check_duplicate_event(text,text,text)`.

### Classification

| Object class | State |
|---|---|
| Tables | `PARTIAL / BLOCKED` |
| Columns | `PARTIAL / BLOCKED` |
| Data types | `PARTIAL / BLOCKED` |
| Defaults | `UNKNOWN` |
| Generated columns | `UNKNOWN` |
| Definition differences | `DIFFERENT DEFINITION` where conflict evidence exists |

### Schema drift example with evidence

- `events.deleted_at` and `events.kabupaten_kota_id` are required by application code and the canonical baseline but absent from the current non-production snapshot. This is documented in [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md).
- `public.check_duplicate_event` has conflicting historical contract evidence, and the canonical function remains separate from the historical `20260121161308` signature. This is recorded in [docs/PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md](PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md) and [docs/PHASE-8.5D-CANONICAL-FUNCTION-FORENSICS.md](PHASE-8.5D-CANONICAL-FUNCTION-FORENSICS.md).

---

## D. CONSTRAINTS

### Constraint evidence

The best evidence is as follows:

- The partial non-production snapshot recorded 14 primary keys, 14 foreign keys, and 3 unique constraints in [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md).
- The migration conflict matrix identifies `events.kabupaten_kota_id` and associated reference semantics as a canonical-compatible but unresolved candidate in [docs/PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md](PHASE-7.4J-D0.2-MIGRATION-CONFLICT-MATRIX.md).
- There is no complete live production constraint comparison available because the production catalog extraction is blocked.

### Classification

No reliable full semantic comparison is available for all constraints. The key issue already identified is the unresolved FK/column drift across `events` and the historical `check_duplicate_event` contract.

---

## E. INDEXES

### Index status

The partial snapshot recorded 11 indexes in the non-production schema. There is no complete live production index comparison because the production catalog is not directly available.

### Drift classification

- `UNKNOWN` for full production vs test comparison.
- `PARTIAL / BLOCKED` for live semantic drift analysis.
- `POTENTIALLY MATERIAL` where the canonical events column drift affects index/constraint semantics.

---

## F. VIEWS

### View status

The partial non-production snapshot listed 1 view in [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md), while the production canonical target identified 3 views. This is not a direct, production-verified equality check, but it is evidence of view-count drift and definition drift.

### Classification

`DIFFERENT DEFINITION` / `BLOCKED`.

---

## G. ENUMS / TYPES

### Evidence

The non-production snapshot records 2 enum types and the migration conflict matrix identifies `app_role` and `pengurus_level` as historical overlap areas in pg-dump replay logic.

The migration forensic analysis explicitly states that `app_role` is created in one earlier migration and then re-created in a dump-based migration, creating a duplicate type conflict in fresh replay.

### Classification

| Enum/type | Classification |
|---|---|
| `public.app_role` | `MIGRATION-LINEAGE-DRIFT` |
| `pengurus_level` | `HISTORICAL/BASELINE ARTIFACT` / `REQUIRES REVIEW` |
| general custom type inventory | `PARTIAL / BLOCKED` |

---

## H. FUNCTIONS

### Public function inventory

Best available evidence shows:

- Non-production snapshot: 20 functions, 0 procedures in [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md).
- Production canonical target file (schema baseline) identifies 47 functions in the baseline specification noted in [docs/security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md](security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md).
- The production function catalog is not directly available in the workspace.

### Function identity rule

The repo repeatedly warns that function identity must be compared by signature, not by name alone. The clearest example is `check_duplicate_event`, where the historical migration signature differs materially from the canonical contract.

---

## I. FUNCTION DEFINITION DRIFT

### High-risk function drift identified

| Function identity | Production hash | TEST hash | Result | Notes |
|---|---|---|---|---|
| `public.check_duplicate_event` | not directly available | historical evidence only | `DIFFERENT` | Historical migration defines a conflicting five-argument row-returning function; canonical baseline is a different contract |
| other functions | not available | partial | `BLOCKED` | Production catalog extraction is blocked |

### Semantic comparison

The historical migration `20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql` is documented as a five-argument, row-returning, similarity-based duplicate-event function. The canonical baseline and current application contract use a different identity, which conflicts with the approved baseline and must not be auto-adopted.

The security-sensitive focus areas are:

- `SECURITY DEFINER` ambiguity
- Authorization and RLS bypass risk
- `search_path` risk
- caller identity handling
- notification and webhook contracts
- assignment/ownership logic

The evidence indicates that the repo is not ready to treat the historical function as canonical or production-safe.

---

## J. FUNCTION GRANTS

### Grants status

No complete production/test EXECUTE-grant comparison is available. The repo repeatedly warns against broad `PUBLIC` / `anon` / `authenticated` EXECUTE on security-sensitive functions, especially where `SECURITY DEFINER` and role semantics are involved.

### Classification

`BLOCKED` — direct grant comparison not available.

---

## K. RLS

### RLS state evidence

The non-production snapshot reports 14 RLS-enabled tables and 32 policies in [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md).

The baseline specification in [docs/security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md](security/PHASE-1-8E2-SCHEMA-BASELINE-DEPLOYMENT.md) says the production reference includes 27 public tables with RLS enabled and 86 policies.

### Drift classification

| Environment | RLS enabled tables | Policy count | Drift |
|---|---:|---:|---|
| Production reference | 27 | 86 | not directly verified live |
| Test snapshot | 14 | 32 | `DIFFERENT RLS STATE` |

The key issue is not simply the count; the semantics are not directly comparable without a complete live catalog. The repo explicitly warns that RLS mismatch is a critical risk area.

---

## L. RLS POLICIES

### Policy evidence

The repo explicitly prioritizes these areas for semantic drift review:

- `profiles`
- `referee_cards`
- `honors`
- `notifications`
- `event_assignments`
- `events`
- `user_roles`
- `system_settings`
- `public_application_settings`
- `referee_contacts`
- `assignment_notifications`
- `notification_channel_claims`
- `meta_webhook_events`
- `event_completion_notifications`

The current workspace evidence does not provide a complete live policy-by-policy diff between production and test, only the partial snapshot counts and the explicit historical drift warnings. That means the semantic policy drift remains `BLOCKED` for full classification.

### Key high-risk signals

- `events` missing required columns and reference semantics.
- `public_application_settings` and notification/webhook tables are called out as security-sensitive boundary objects.
- The repo warns against assuming policy equivalence without production verification.

---

## M. TABLE GRANTS

### Status

No complete `SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` comparison is available. The repo warns that broad table grants on RLS-enabled tables are a risk but not proof of vulnerability by themselves.

### Current classification

`BLOCKED` with conditional risk flag, not assertive vulnerability finding.

---

## N. TRIGGERS

### Trigger inventory

The partial non-production snapshot records 8 triggers in [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md). The production live trigger inventory is blocked.

### Priority watchlist

- assignment-related triggers
- event-related triggers
- notification triggers
- webhook triggers
- profile-related triggers
- honor-related triggers
- settings-related triggers

All are currently `UNVERIFIED / BLOCKED`.

---

## O. EXTENSIONS

### Extension status

The snapshot states that extensions are 0 in the schema dump scope in [docs/PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md](PHASE-7.4J-D1-D.3-PREFLIGHT-REPORT.md). The production inventory is not available because the catalog extraction is blocked.

### Classification

`BLOCKED` for full cross-environment comparison.

---

## P. EDGE FUNCTIONS

### Edge function drift status

The repo explicitly names the high-risk functions as:

- `send-whatsapp`
- `notification-orchestrator`
- `meta-whatsapp-webhook`
- `kirisan-webhook`
- `send-assignment-notification`
- `auto-complete-events`
- `update-application-settings`
- `test-email-config`
- `send-event-notification`

The local configuration inventory does show these as declared functions, and `meta-whatsapp-webhook` is explicitly configured with `verify_jwt = false`, which is a security boundary drift marker.

### Classification

| Function | Status |
|---|---|
| Local declared function inventory | `PRESENT` |
| Production deployed inventory | `NOT VERIFIED LIVE` |
| `meta-whatsapp-webhook` | `AUTHENTICATION DRIFT CANDIDATE` |
| others | `PARTIAL / UNVERIFIED` |

---

## Q. EDGE FUNCTION AUTHORIZATION DRIFT

The repo treats this as a critical area. The most important review points are:

- authenticated requirement
- role allowlist
- service-role usage
- secret usage
- direct database access
- external provider calls

The local config shows `verify_jwt` values but not a live deployment/authorization contract diff across production and test. Therefore the edge-function authorization drift remains `BLOCKED` pending a live or secure metadata inventory.

---

## R. SECURITY-CRITICAL OBJECTS

### Security-relevant drift currently evidenced

- Authentication boundary mismatch: project identity and runtime binding are separate from production; local config is not a proof of production parity.
- Authorization drift: `SECURITY DEFINER` and historical `check_duplicate_event` contract conflict.
- RLS drift: snapshot counts differ materially from production reference counts.
- Secret boundary: the repository is explicit that secrets are not printed or recorded.
- Provider credential access: unknown in production/test live metadata.
- Notification ownership and webhook semantics: called out as high risk and specific priors remain unresolved.
- Assignment ownership and public settings boundary: key risk objects flagged.
- Referee financial data and card issuance: marked as high-risk design category but not directly live-verified.

### Security impact verdict

The evidence supports a cautionary classification of the drift as `SECURITY CRITICAL / REQUIRES RECONCILIATION`, but not as a proven live vulnerability.

---

## S. APPLICATION-CRITICAL DRIFT

### Required object watchlist

The following objects were explicitly called out in the brief and are high-priority review candidates:

- `assignment_notifications`
- `notification_channel_claims`
- `meta_webhook_events`
- `message_delivery_ledger`
- `event_completion_notifications`
- `public_application_settings`
- `referee_contacts`
- `referee_card_counters`

### Current disposition

| Object | Classification |
|---|---|
| `assignment_notifications` | `REQUIRES REVIEW` |
| `notification_channel_claims` | `REQUIRES REVIEW` |
| `meta_webhook_events` | `REQUIRES REVIEW` |
| `message_delivery_ledger` | `REQUIRES REVIEW` |
| `event_completion_notifications` | `REQUIRES REVIEW` |
| `public_application_settings` | `REQUIRES REVIEW` |
| `referee_contacts` | `REQUIRES REVIEW` |
| `referee_card_counters` | `REQUIRES REVIEW` |

These are not automatically promotable; they require exact production-vs-test semantics review before any promotion decision.

---

## T. CANONICAL CLASSIFICATION MATRIX

| Object / Area | Production | Test | Drift Type | Canonical State | Security Impact | Promotion Candidate | Dependency Evidence |
|---|---|---|---|---|---|---|---|
| project identity | `xfscfjwapwnkiinkgbjg` | `shorsqyycpptxcutrqrb` | `ENVIRONMENT-SPECIFIC` | `PRODUCTION-CANONICAL` / `TEST-CANONICAL` depending context | low on its own | no | project metadata and security docs |
| migration ledger | production catalog blocked | local+remote drift | `HISTORICAL` | `REQUIRES RECONCILIATION` | high | no | migration drift docs |
| `app_role` type | not directly available | conflict evidence | `HISTORICAL` | `REQUIRES RECONCILIATION` | high | no | migration conflict matrix |
| `events.deleted_at` | production baseline expects it | absent in snapshot | `DIFFERENT DEFINITION` | `REQUIRES RECONCILIATION` | high | no | preflight report |
| `events.kabupaten_kota_id` | production baseline expects it | absent in snapshot | `DIFFERENT DEFINITION` | `REQUIRES RECONCILIATION` | high | no | preflight report |
| `check_duplicate_event` | canonical contract exists | historical conflicting signature | `DIFFERENT DEFINITION` | `PRODUCTION-CANONICAL` | high | no | function forensics |
| `20260908085000` reconstruction migration | not production target | remote-only / local source recovered | `HISTORICAL` | `HISTORICAL` | high | no | migration drift report |
| RLS policies | 86 reference count | 32 snapshot count | `DIFFERENT DEFINITION` | `REQUIRES RECONCILIATION` | high | no | preflight report |

### Canonical-choice rule

The repository evidence explicitly says not to choose TEST as canonical solely because it is newer. The canonical state in this phase remains unresolved and cannot be promoted until the structure is reconciled and reviewed.

---

## U. PROMOTION CANDIDATES

The repo does not authorize any promotion candidate here. The current read-only evidence supports only the following conservative statement:

- Candidate items are not automatically promotable.
- Candidate review is limited to governance-level evaluation, not execution.
- No migration or deployment artifact may be generated in this phase.

### Current candidate pool (review-only)

- `20260110162455_98e87d41-5e63-4dba-9290-9fb5f39f3a12.sql` — candidate for missing `events` semantics only after governance review.
- App-critical objects remain `REQUIRES REVIEW` only.

No item is approved for production promotion in Phase 0.

---

## V. BLOCKERS

### Critical

1. Production live catalog extraction is blocked: [docs/backend/production-catalog/PRODUCTION-CATALOG-EXTRACTION.md](backend/production-catalog/PRODUCTION-CATALOG-EXTRACTION.md).
2. Production direct migration comparison is not available.
3. Historical reconstruction migration `20260908085000` is destructive and must not be replayed.
4. `app_role` duplication and broad dump-replay conflict are documented as migration-lineage drift.
5. `check_duplicate_event` function contract is materially conflicting and cannot be auto-adopted.
6. RLS policy count and semantics differ materially between production reference and test snapshot.

### High

1. Partial non-production snapshot is incomplete relative to canonical target.
2. Missing `events` columns and production canonical schema mismatch.
3. Application-critical notification/webhook/settings objects require review.
4. Edge function `verify_jwt` inventory is not equivalent to live authorization verification.

### Medium

1. Extension inventory incomplete.
2. Grant comparison incomplete.
3. Trigger and index inventory incomplete.
4. View definitions and type compatibility remain unresolved.

### Low

1. Local workspace evidence is sufficient for governance but not for live production parity.
2. Environment identity is known, but runtime semantics remain unresolved.

---

## W. FINAL GATE

### Gate result: BLOCKED

The Phase 0 gate is `BLOCKED` because the following conditions are not satisfied:

- inventory complete: no
- drift classified: partial only, not complete for live production/test parity
- canonical state identified: no authoritative production/test canonical reconciliation yet
- blockers documented: yes
- evidence sufficient: partially sufficient for governance, not sufficient for promotion

This result does not mean the production environment is safe to mutate. It means the repo has enough evidence to define the boundary and the blocker set, but not enough evidence to perform promotion or production mutation.

### Final safety statement

No database mutation, migration execution, deployment, schema change, edge-function deployment, secret or policy change, or production/test modification was performed in this phase.
