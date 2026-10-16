# PHASE-7.4D Contract Mapping

Version: v1.0.0
Status: DESIGN ONLY

## Capability map

| Application capability | Current path | Database responsibility | Future repository method | Contract state |
| --- | --- | --- | --- | --- |
| Boolean duplicate existence | `useCheckDuplicateEvent` intended consumer | `public.check_duplicate_event(text,text,text) RETURNS boolean` | `checkDuplicateExists` | EXISTING CANONICAL |
| Rich duplicate discovery | `useEvents.ts:556` via EventEdit | New separately governed function | `searchDuplicateEvents` | NEW REQUIRED / TBD |

The canonical function must remain permanent unless a future deprecation decision explicitly changes that status. No direct substitution is authorized.

## Current application DTO mapping

Observed input DTO:

- `name: string`
- `date: string` formatted `yyyy-MM-dd`
- `location?: string`
- `kabupatenKotaId?: string`
- `excludeEventId?: string`

Observed output DTO:

- `isDuplicate: boolean`
- `duplicates[]` with `id`, `name`, `date`, `location`, `status`, `similarity_score`

Transformation boundary: repository/application service, not UI. Final database return types and validation are `TBD / GOVERNANCE REQUIRED`.

## Related verified objects

The historical rich-search body reads `public.events`. `public.event_approvals` and `public.audit_logs` are used by adjacent event lifecycle operations, not by the duplicate-search body. No unverified object is added to this design.

## Error and empty-result design

Error mapping, timeout behavior, authorization denial, and empty-result behavior are `TBD / GOVERNANCE REQUIRED`. The current application treats a failed duplicate check as allow-to-proceed, which requires explicit security and product review before repository migration.

## Compatibility

Existing callers of the three-argument canonical function remain unaffected. Rich search is additive only if separately approved. No overload, replacement, wrapper, or deprecation is selected without governance.
