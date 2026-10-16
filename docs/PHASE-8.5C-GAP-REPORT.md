# Phase 8.5C Gap Report

## G-85C-001 — Canonical semantic mismatch

Type generation proves the canonical signature, but the function body references `events.kota_id`; canonical `events` table has `kabupaten_kota_id`. Mapping `p_kota_id` to the latter would be an assumption and could alter duplicate semantics. Resolve schema/function governance before caller changes.

## G-85C-002 — Transaction implementation blocked

No existing atomic mechanism exists. New PostgreSQL function/RPC requires exact authorization, RLS, input/output, audit, notification, and idempotency approval. No migration/function was created.

## G-85C-003 — Idempotency unresolved

No canonical uniqueness/idempotency field or constraint was established. UI disablement alone does not guarantee retry safety.

## Classification

- Type generation: PASS as a read-only Non-Production operation.
- Application reconciliation: BLOCKED.
- Transaction function: BLOCKED before implementation.
- Production safety: PASS, all counters zero.
- Production UAT: NOT READY.
