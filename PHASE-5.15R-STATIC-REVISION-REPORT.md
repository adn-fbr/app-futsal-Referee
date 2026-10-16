# PHASE-5.15R STATIC REVISION & REVALIDATION REPORT

## Environment

- TEST project: shorsqyycpptxcutrqrb
- Production: NOT ACCESSED
- Scope: static validation only; no migration execution, DDL, DML, fixture seeding, or database grants changed

## Revision

- public.get_actor_provinsi_id() -> private.get_actor_provinsi_id()
- public.get_actor_kabupaten_kota_id() -> private.get_actor_kabupaten_kota_id()

## Static checks

| Check | Result | Notes |
|---|---|---|
| helper signature | PASS | zero-argument canonical private helpers are the required contract |
| helper schema | PASS | canonical helper path uses private schema, not public |
| helper security properties | PASS | SECURITY DEFINER + SET search_path = '' is the required static boundary |
| RPC signature | PASS | public.assign_referee_to_event(uuid, uuid, text) remains the expected shape |
| SECURITY DEFINER | PASS | RPC uses SECURITY DEFINER |
| search_path | PASS | SET search_path = '' used |
| explicit schema qualification | PASS | all critical references are schema-qualified |
| actor derivation | PASS | actor comes from auth.uid() exclusively |
| admin_provinsi scope | PASS | requires role + private.get_actor_provinsi_id() + event/referee province equality |
| admin_kab_kota scope | PASS | requires role + private.get_actor_kabupaten_kota_id() + event/referee city equality |
| Panitia owner scope | PASS | requires event.created_by = auth.uid(); no role-only fallback |
| E1–E5 | PASS | all five eligibility predicates remain enforced |
| license soft rule | PASS | soft ranking is not hard-blocking |
| date-range conflict | PASS | uses distinct private conflict primitive and target exclusion semantics |
| duplicate rule | PASS | partial unique index on non-cancelled rows preserves NEW_ROW_AFTER_CANCEL |
| reassignment rule | PASS | cancelled history remains intact; no row deletion or normalization |
| canonical role | PASS | only CADANGAN accepted; legacy rows remain unchanged |
| server-controlled pending status | PASS | status is set to pending by the server |
| concurrency lock | PASS | referee profile row is locked FOR UPDATE OF p before validation/insert |
| EXECUTE ACL | PASS | PUBLIC/anon denied; authenticated allowed |
| direct INSERT deferred | PASS | explicit deferral remains in place until consumer cutover + runtime verification |
| rollback safety | PASS | rollback protects authorization, avoids unsafe fallback, and blocks on duplicate rows |

## Required reference revalidation

- incorrect public.get_actor_* references = 0
- correct private.get_actor_* references = 2

This was verified by searching the draft migration artifact for the incorrect public helper references and confirming the canonical private helpers remain in the RPC logic.

## Final gate

PASS — STATIC REVISION COMPLETE

Conditions met:

- incorrect helper references = 0
- all required static checks = PASS
- no unresolved contract contradiction in the reviewed draft
- no migration executed
- production untouched
