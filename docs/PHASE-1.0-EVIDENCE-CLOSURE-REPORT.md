# PHASE 1.0 — Evidence Closure Report

Date: 2026-09-24
Mode: READ-ONLY
Production: xfscfjwapwnkiinkgbjg (AFP SULSEL)
Test: shorsqyycpptxcutrqrb (test APP)

## Gate

STATUS: BLOCKED

Reason: live metadata is now available, but production/test canonical parity is not established and migration lineage remains divergent. Security-boundary reconciliation is also required before any migration execution.

## Live structural evidence

| Object | Production | Test |
|---|---:|---:|
| public tables | 29 | 37 |
| public views | 3 | 3 |
| public functions | 81 | 106 |
| public triggers | 26 | 29 |
| public policies | 90 | 95 |
| public indexes | 92 | 116 |
| public FKs | 33 | 38 |
| RLS enabled tables | 29 | 37 |
| RLS disabled tables | 0 | 0 |

## Test-only application tables observed

- assignment_notifications
- event_completion_notifications
- message_delivery_ledger
- meta_webhook_events
- notification_channel_claims
- public_application_settings
- referee_card_counters
- referee_contacts

No production-only application table was observed from the current public-table inventory.

## Migration lineage

Production remote history currently exposes 8 versions beginning at 20260908204548 and contains the phase-8.5F through 8.10.1 lineage plus later hardening/domain migrations.

Test remote history contains earlier 2026-01 versions, the historical `20260908085000 canonical_baseline_reconstruction`, phase-8 migrations, Safe Public Application Settings migrations, Kirisan/message-delivery migrations, Meta webhook migrations, assignment state-machine recovery, and later event-completion migrations.

`20260908085000 canonical_baseline_reconstruction` remains classified as HISTORICAL_BASELINE_ARTIFACT and is not approved for replay.

## Function/security evidence

Production contains application SECURITY DEFINER functions in the exposed `public` schema. Current Supabase security advisors report:

- 42 SECURITY DEFINER functions executable by `anon`.
- 4 RLS-enabled public tables without policies: activity_logs, auth_attempts, event_logs, system_settings.
- 4 functions with mutable search_path.
- pg_trgm installed in public schema.

Test advisors report:

- 39 SECURITY DEFINER functions executable by `anon`.
- 10 RLS-enabled public tables without policies.
- 3 functions with mutable search_path.
- pg_trgm installed in public schema.

These are audit findings only; no remediation was executed.

## Canonical classification decision

The current evidence does NOT support treating Test as a drop-in canonical replacement for Production, nor Production as the complete canonical target for Test.

The additional Test tables correspond to later notification/webhook/settings/card/contact work and therefore require explicit classification as CANONICAL, TEST_ONLY, or DEFERRED rather than automatic deletion or promotion.

## Safety counters

- Production mutation: 0
- Test mutation: 0
- DDL executed: 0
- DML executed: 0
- Migration applied: 0
- Migration repair: 0
- Deployment: 0
- Secret reads: 0

## Next gate

Proceed to PHASE 1.1 — Canonical Object Classification.

Required classification groups:
1. Core shared application schema
2. Test-only notification/Kirisan/Meta/settings/card/contact additions
3. Historical migration artifacts
4. Security-sensitive privilege/RLS/function drift
5. Supabase-managed/non-application objects

No production or test mutation is authorized by this phase.
