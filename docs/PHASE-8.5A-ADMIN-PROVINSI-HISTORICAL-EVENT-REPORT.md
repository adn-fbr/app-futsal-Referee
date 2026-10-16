# PHASE 8.5A — HISTORICAL EVENT CONTRACT RECONCILIATION & TRANSACTION INTEGRITY

## Final Gate

**BLOCKED**

Production UAT: **NOT READY**.

## Duplicate contract finding

The canonical function is `public.check_duplicate_event(p_kota_id text, p_location text, p_name text) RETURNS boolean`. The application caller in `useEvents.ts` sends five historical parameters and expects an array, while `EventEdit.tsx` renders duplicate record details. Generated Supabase types also contain the stale five-argument/array contract.

Because the approved canonical type source is unavailable, no generated type regeneration or caller adaptation was performed. No rich RPC, overload, SQL, or schema change was created. This is a confirmed contract blocker.

## Transaction integrity finding

`useCreateEvent` inserts an `events` row and then independently inserts an `event_approvals` row. If approval insertion fails, the event remains and the hook logs the error without failing the operation. No existing transactional repository, Edge Function, RPC, trigger, or backend transaction boundary was found. A client-side delete/rollback would not guarantee atomicity under RLS.

This requires a separately authorized backend transaction architecture. It was not implemented speculatively.

## Files changed

No source files, config files, schema, RLS, Auth, RPC, migrations, or Edge Functions were changed in Phase 8.5A. Only the eight required Phase 8.5A artifacts were created.

## Database/Auth/RLS

- Database queries: 0.
- Database mutations: 0.
- Auth fixture operations: 0.
- RLS changes: 0.
- Production access/mutation/deployment: 0.
- Existing Auth/RBAC/RLS paths were inspected but not remotely tested.

## Tests/build/lint

- TypeScript: PASS.
- Existing tests: PASS, 10 files / 28 tests.
- Build: PASS.
- Lint: pre-existing 66 errors / 11 warnings.
- Contract runtime tests: BLOCKED.
- Transaction failure/retry tests: BLOCKED.

## Remaining blockers

1. Approved canonical type-generation source for `check_duplicate_event`.
2. Safe application adaptation to boolean result.
3. Authorized transaction boundary for event+approval atomicity.
4. Synthetic Non-Production identities/fixtures and RLS/browser execution.

## Recommended next phase

**PHASE 8.5B — CANONICAL TYPE SOURCE + EVENT CREATION TRANSACTION DESIGN**

It must first obtain governance approval for type source and transaction architecture. If a new backend transaction mechanism is required, design and security review must precede implementation.

**BLOCKED**
