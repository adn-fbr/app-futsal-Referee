# Phase 8.5A Contract Reconciliation

## Current gate

**BLOCKED**

Canonical schema evidence is authoritative and is not modified. The caller/type layer remains historically incompatible.

## Caller matrix

| Caller | Current arguments | Canonical | Result |
|---|---|---|---|
| `useEvents.ts:556` | name, date, location, kota, exclude ID | p_kota_id, p_location, p_name -> boolean | mismatch |
| `EventEdit.tsx:83` | expects `duplicates[0].name` | boolean | UI contract mismatch |
| generated `types.ts:1430` | historical five-arg args/array return | three text args/boolean | generated source stale |
| Edge Functions/tests | no additional duplicate RPC caller found | same canonical | no additional caller |

## Safe decision

Do not modify generated types manually and do not create rich duplicate-search RPC. Regenerate types only from an approved canonical source, then adapt the hook and UI to boolean semantics. Until that source is available, duplicate validation must remain marked blocked rather than silently treated as reliable.
