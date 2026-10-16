# Phase 1.8E Synthetic Fixtures

## Status

**READY as a design; BLOCKED for creation until the test project exists.**

## Required synthetic identities

Use non-PII addresses such as `security-test-a@example.invalid` and `security-test-b@example.invalid` only in the test project.

- `USER_A` with `wasit`, region A.
- `USER_B` with `wasit`, region B.
- separate `ADMIN_PROVINSI`, `ADMIN_KAB_KOTA`, `PANITIA`, and `EVALUATOR` users where required.

Do not assign multiple roles unless a specific interaction test requires it.

## Actual schema mapping

- `PROVINSI_A/B` -> `provinsi`.
- `REGION_A/B` -> `kabupaten_kota` linked by `provinsi_id`.
- `PROFILE_A/B` -> `profiles` linked by Auth user ID and `kabupaten_kota_id`.
- roles -> `user_roles`.
- resources -> actual `events`, `event_assignments`, `event_approvals`, `honors`, `evaluations`, `evaluation_scores`, `referee_cards`, and notification tables.
- audit outputs -> actual `audit_logs`, `activity_logs`, `auth_event_logs`, and `event_logs`.

## Principles

Synthetic, minimal, deterministic, reproducible, isolated, non-PII, and prefixed `SECURITY_TEST_`. Fixture setup must reject production ref and URL and require `TEST_ENVIRONMENT=non-production`.
