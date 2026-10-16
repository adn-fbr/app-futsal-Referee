# Phase 8.5A Gap Report

## GAP-85A-001 — Canonical duplicate contract

Canonical local schema is `check_duplicate_event(p_kota_id text, p_location text, p_name text) RETURNS boolean`. The only application caller sends five historical named arguments and expects duplicate records. Generated Supabase types repeat the historical contract. The application cannot be safely reconciled without an approved canonical type-generation source. No rich RPC, overload, SQL change, or generated-type hand edit was made.

**Status: BLOCKED.**

## GAP-85A-002 — Event/approval transaction boundary

`useCreateEvent` performs independent event and approval inserts. Approval failure is logged and does not fail/rollback the event. No existing atomic repository/backend/function exists. Client compensation is not an atomic transaction and may fail under RLS.

**Status: BLOCKED — SCHEMA / TRANSACTION GAP.**

## GAP-85A-003 — Live authorization/RLS

Historical UI is Admin Provinsi-scoped statically, but live positive/negative RLS and Auth tests require synthetic identities and fixtures unavailable in this phase.

**Status: BLOCKED LIVE VALIDATION.**

## Required next phase

Obtain approved canonical type source and transaction architecture decision. Then implement only the selected safe boundary and run Non-Production tests for duplicate contract, atomic event+approval, retry, double submit, Auth/RBAC, RLS, audit, and notification.
