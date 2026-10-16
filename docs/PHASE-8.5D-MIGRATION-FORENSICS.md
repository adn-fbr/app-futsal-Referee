# Phase 8.5D Migration Forensics

## Classification

| Evidence | Finding | Classification |
|---|---|---|
| `supabase/migrations/20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql:101` | Five-argument `check_duplicate_event`, row result, similarity/date logic, `kabupaten_kota_id` filter | HISTORICAL / CONFLICTING |
| `production-schema.sql:151` | Three text arguments, boolean result, exact `kota_id`/location/name body | AUTHORITATIVE CANONICAL SOURCE, BODY CONFLICT |
| `CANONICAL-RUNTIME-BASELINE.sql:151` | Same three-argument body and identity | AUTHORITATIVE CANONICAL BASELINE |
| `docs/PHASE-7.4J-D1-D.4-CANONICAL-INVENTORY.json` | Three-argument identity; no five-argument function | AUTHORITATIVE INVENTORY |
| Application hook and generated types | Five-argument row-returning contract | APPLICATION / HISTORICAL |

## Git lineage

`git blame` attributes the canonical baseline definition to `74dcc12e` and the five-argument migration plus caller to `cb5098f`. `git log -S` finds those two contract lineages and no reconciled intermediate definition.

The five-argument migration is evidence of historical application behavior, not authorization to replay or adopt that function. The canonical baseline supersedes it for this phase.

## Conclusion

Migration history demonstrates independent evolution and contract replacement, but it does not establish the intended meaning of `p_kota_id`. The correct classification is a multi-layer conflict, not a proven application-only or database-only defect.

No migration was replayed, created, or modified.
