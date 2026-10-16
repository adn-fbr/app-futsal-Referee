# PHASE-7.4 BATCH-01 EVENTS REPORT

Version: v1.0.0
Status: BLOCKED

## Scope

Files inspected: 3. Planned operations: 33.

- `src/hooks/useEvents.ts`: 26 direct operations.
- `src/pages/EventSubmission.tsx`: 5 direct operations.
- `src/hooks/useAutoCompleteEvents.ts`: 2 direct operations.

## Migration result

Files migrated: 0.
Operations migrated: 0.
Repositories created or extended: none.
Direct business Supabase accesses removed: 0.
Direct business Supabase accesses remaining in this batch: 33.

## Canonical objects reviewed

`public.events`, `public.event_approvals`, and `public.audit_logs` are present in the immutable baseline. The configured Storage bucket `documents` and Edge Functions are externally managed. `public.check_duplicate_event(text,text,text)` is present in the baseline, but it does not match the five-argument application call.

## Blocking finding

At `src/hooks/useEvents.ts:556`, the application calls `check_duplicate_event` using five named arguments and expects duplicate rows. The immutable baseline defines three text arguments and returns `boolean`. Current generated types agree with the application call but are not an authorized replacement for the immutable baseline. Migrating this call would require fabricating or selecting an unverified contract, which is prohibited.

## Gate checks

| Gate | Result | Reason |
| --- | --- | --- |
| Repository interface | BLOCKED | Contract mismatch must be resolved first |
| Supabase implementation | BLOCKED | No unverified RPC may be implemented |
| Consumer migration | BLOCKED | Would preserve an unresolved contract |
| No direct business access in batch | BLOCKED | No files migrated |
| TypeScript strict | PASS | `npx tsc --noEmit` completed without output |
| Unit tests | FAIL / BASELINE | 4 passed, 5 failed with Vitest internal-state errors; no batch code was changed |
| Build | PASS | `npm run build` completed; existing chunk-size and Browserslist warnings remain |
| RLS/security review | BLOCKED | RPC contract and authorization behavior differ |
| Hard-coded identity | PASS | No new code |
| Service-role in browser | PASS | No new code |
| Schema fabrication | PASS | None performed |
| Production access | PASS | Not used |
| Demo fallback | PASS | No fallback changed |

## Validation evidence

The focused direct-access scan found 8 source lines containing direct Supabase calls across the three files; multiline call chains account for the 33 normalized operations reported above. The full lint command reports the existing repository baseline of 66 errors and 11 warnings. Since no application file was changed, lint delta is 0 new errors and 0 fixed errors.

## Safety result

Application source, database, migrations, baseline, dependency graph, and Auth configuration were not modified. Production connection, SQL, mutation, and deployment were not used or authorized.

BATCH-02 is not authorized.
