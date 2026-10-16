# PHASE-7.3B Dynamic Table Resolution

Version: v1.0.0
Status: PASS

## Code path

`src/lib/systemRules.ts` defines `softDelete(table, id)` at line 4 and `restoreRecord(table, id)` at line 17. Both call `.from(table).update(...).eq('id', id)`. The parameter is a TypeScript string-literal union, not a free-form string. Repository-wide source search found no callers beyond the definitions, no configuration source, no enum conversion, and no user or external input feeding the parameter.

## DYNAMIC-TABLE-RESOLUTION-MATRIX

| Source | Variable | Possible Value | Canonical Object | Evidence | Confidence |
| --- | --- | --- | --- | --- | --- |
| `softDelete` parameter | `table` | `profiles` | `public.profiles` | Closed union in `systemRules.ts:5`; baseline table | HIGH |
| `softDelete` parameter | `table` | `events` | `public.events` | Closed union in `systemRules.ts:5`; baseline table | HIGH |
| `softDelete` parameter | `table` | `honors` | `public.honors` | Closed union in `systemRules.ts:5`; baseline table | HIGH |
| `softDelete` parameter | `table` | `event_assignments` | `public.event_assignments` | Closed union in `systemRules.ts:5`; baseline table | HIGH |
| `restoreRecord` parameter | `table` | `profiles` | `public.profiles` | Closed union in `systemRules.ts:18`; baseline table | HIGH |
| `restoreRecord` parameter | `table` | `events` | `public.events` | Closed union in `systemRules.ts:18`; baseline table | HIGH |
| `restoreRecord` parameter | `table` | `honors` | `public.honors` | Closed union in `systemRules.ts:18`; baseline table | HIGH |
| `restoreRecord` parameter | `table` | `event_assignments` | `public.event_assignments` | Closed union in `systemRules.ts:18`; baseline table | HIGH |

No value falls outside the union. The resolved set is security-sensitive because it performs updates, but it is not unresolved. Future repository APIs should expose explicit methods or preserve this allowlist and rely on RLS; client-side typing is not an authorization substitute.
