# Phase 8.5B Transaction Design

## Current failure

`useCreateEvent` performs independent PostgREST mutations: `events.insert` then `event_approvals.insert`. Approval failure is logged and the event remains. This violates the desired invariant for required approval state.

## Selected design

**Option A: governed PostgreSQL function/RPC invoked as one logical operation.** The database function must insert the event and required `event_approvals` row within one PostgreSQL statement/transaction context and return only after both succeed. Any error must abort the operation so no incomplete event/approval pair commits.

Preferred security mode: `SECURITY INVOKER`, preserving existing RLS and `auth.uid()` context. The function must verify Admin Provinsi and province scope using canonical role/profile/RLS mechanisms; it must not rely on password, user metadata, email, service-role browser credentials, or frontend visibility.

## Contract constraints

- Existing `DIAJUKAN` event status remains.
- Approval status remains existing `pending`.
- No Historical database status or field.
- Existing audit trigger on `event_approvals` should execute inside the same transaction if the insert succeeds.
- External notifications must not be treated as atomic DB state; failures need explicit post-commit semantics.

## Not implemented

The exact function identity/signature, return shape, authorization SQL, idempotency mechanism, and RLS proof require separate approval. No RPC/function/migration was created in 8.5B.
