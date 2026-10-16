# PHASE 7.4J-D1-A PRODUCTION SAFETY

## Protection rules

- Production project must not be touched.
- Production credentials must not appear in execution paths.
- Production data must not be copied.
- Production Auth state must not be inspected or copied.
- Production Storage must not be touched.
- Production deployment must not occur.

## Safety counters

- PRODUCTION_ACCESS = NO
- PRODUCTION_MUTATION = NO
- PRODUCTION_DEPLOYMENT = NO
- DATABASE_MUTATION = 0
- MIGRATION_EXECUTION = 0
- RESET = 0
- REBUILD = 0
- SEED = 0
- AUTH_MUTATION = 0
- STORAGE_MUTATION = 0
- RLS_MUTATION = 0
- APPLICATION_IMPLEMENTATION = 0
- BASELINE_MODIFICATION = 0

## Stop condition

If any Production access is detected, execution stops immediately and status becomes BLOCKED.
