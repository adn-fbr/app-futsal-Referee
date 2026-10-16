# Phase 1.8B Runtime Table Inventory

## Status

**PASS for schema dump table inventory.** Runtime public schema metadata was obtained from the read-only dump.

## Actual public tables

`events`, `honors`, `activity_logs`, `audit_logs`, `auth_attempts`, `auth_event_logs`, `card_verification_logs`, `discussion_replies`, `discussion_topics`, `evaluation_criteria`, `evaluation_scores`, `evaluations`, `event_approvals`, `event_assignments`, `event_logs`, `kabupaten_kota`, `learning_materials`, `learning_progress`, `notification_preferences`, `notifications`, `pengurus`, `profiles`, `provinsi`, `referee_cards`, `referee_reviews`, `system_settings`, and `user_roles`.

## Required runtime table output

The following application tables are required for catalog inspection. Each status is `UNKNOWN / BLOCKED`, not `NOT FOUND`, because no runtime catalog was available:

`profiles`, `user_roles`, `events`, `event_assignments`, `event_approvals`, `referee_cards`, `card_verification_logs`, `evaluations`, `evaluation_scores`, `honors`, `audit_logs`, `activity_logs`, `auth_event_logs`, `event_logs`, `notifications`, `system_settings`.

Additional application-referenced tables must be included when the catalog is available: `provinsi`, `kabupaten_kota`, `pengurus`, `referee_reviews`, `learning_materials`, `learning_progress`, `discussion_topics`, `discussion_replies`, and `notification_preferences`.

## Required columns / relationships

The catalog query must document schema, relation type, owner, persistence, estimated rows, RLS enabled/forced, columns, defaults, identity/generated status, PK/unique/FK/check constraints, indexes, and partition metadata. It must specifically correlate `auth.users`, `profiles`, and `user_roles` without exporting email, phone, password, JWT, or other PII.

## Runtime relationship evidence

- `profiles.id` references `auth.users.id` with `ON DELETE CASCADE`.
- `user_roles.user_id` references `auth.users.id` with `ON DELETE CASCADE`.
- `profiles.kabupaten_kota_id` references `kabupaten_kota.id`.
- `kabupaten_kota.provinsi_id` references `provinsi.id`.
- `events.kabupaten_kota_id` references `kabupaten_kota.id`.
- `event_assignments.event_id` references `events.id` and `referee_id` references `profiles.id`.
- `honors.event_id` references `events.id` and `referee_id` references `profiles.id`.
- `evaluations.event_id` references `events.id` and `referee_id` references `profiles.id`.

## Security-relevant runtime columns

The schema dump confirms the following ownership/scope columns exist in the corresponding runtime tables: `profiles.id`, `profiles.kabupaten_kota_id`; `user_roles.user_id`, `user_roles.role`; `provinsi.id`; `kabupaten_kota.id`, `kabupaten_kota.provinsi_id`; `pengurus.user_id`, `pengurus.provinsi_id`, `pengurus.kabupaten_kota_id`; `events.created_by`, `events.kabupaten_kota_id`; `event_assignments.event_id`, `event_assignments.referee_id`; `event_approvals.event_id`, `event_approvals.approver_id`; `honors.event_id`, `honors.referee_id`, `honors.verified_by`; `evaluations.event_id`, `evaluations.referee_id`, `evaluations.evaluator_id`; `evaluation_scores.evaluation_id`, `evaluation_scores.criteria_id`; `referee_cards.referee_id`; `card_verification_logs.card_id`; `notifications.user_id`; `notification_preferences.user_id`; `learning_progress.user_id`; `discussion_topics.author_id`; `discussion_replies.author_id`, `discussion_replies.topic_id`; `audit_logs.actor_id`; `auth_event_logs.user_id`; and `system_settings.key`.

The dump is schema-only, so no values or row-level ownership conclusions were collected.

## Evidence boundary

The 27 names above are actual public table definitions in the runtime schema dump. `activity_logs`, `auth_attempts`, and `event_logs` are runtime tables not represented in the earlier generated application contract. No row count was collected.
