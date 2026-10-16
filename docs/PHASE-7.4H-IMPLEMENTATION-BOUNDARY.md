# PHASE 7.4H Implementation Boundary

## Allowed After Freeze

- Non-Production implementation design may begin at the next gate.
- Contract tests, security/RLS tests, performance validation, and rollback design belong to the separate implementation phase.

## Not Authorized in Phase 7.4H

- Application implementation.
- Database modification.
- Function creation or alteration.
- Index creation.
- Migration creation or execution.
- Production SQL.
- Production access or data extraction.
- Production mutation.
- Deployment.
- Baseline modification.
- RLS policy modification.
- SECURITY DEFINER escalation.

## Preserved Objects and Evidence

- Canonical function: `public.check_duplicate_event(text,text,text) RETURNS boolean`.
- Canonical baseline: unchanged.
- Baseline hash: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.
- Rich-search physical function identity: TBD.

## Next Gate

**PHASE 7.4I — NON-PRODUCTION IMPLEMENTATION DESIGN**
