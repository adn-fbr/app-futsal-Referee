# PHASE 7.4J-D1-A MIGRATION POLICY

## Decision summary

D0.9A resolved the migration conflict posture.

- Historical pg_dump replay: ARCHIVE_AS_HISTORICAL
- Events migration drift: SUPERSEDE_BY_CANONICAL
- Duplicate function conflict: REJECT

## Policy

Initial reconstruction must not replay the historical 55-migration chain.

Initial reconstruction target:

- CANONICAL BASELINE

Future migrations:

- OPTION C only after canonical reconstruction is validated

## Important constraint

The historical migration chain must not be used as the primary path for any approval or execution. A canonical baseline reconstruction is the governing target.
