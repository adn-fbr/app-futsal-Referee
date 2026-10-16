# PHASE 7.4J-B — NON-PRODUCTION SCHEMA RECONCILIATION

STATUS:
BLOCKED

NON-PRODUCTION:
shorsqyycpptxcutrqrb

PRODUCTION:
xfscfjwapwnkiinkgbjg

CLI TARGET:
NON-PRODUCTION

EVENTS SCHEMA:
DRIFTED

deleted_at:
MISSING in target evidence

kabupaten_kota_id:
MISSING in target evidence

MIGRATION HISTORY:
INCONSISTENT

ROOT CAUSE:
MULTIPLE_CAUSES — stale/partial test schema plus migration-history drift; runtime catalog dump could not complete.

DATA STATUS:
UNKNOWN

RLS:
UNKNOWN

GENERATED TYPES:
DRIFTED AGAINST TARGET / ALIGNED TO CANONICAL EXPECTATION

PRODUCTION BASELINE:
UNCHANGED

PRODUCTION ACCESS:
NO

PRODUCTION MUTATION:
NO

RECOMMENDED PATH:
REBUILD_RECOMMENDED

SQL MUTATION:
NO

MIGRATION EXECUTION:
NO

DATABASE MUTATION:
NO

APPLICATION IMPLEMENTATION:
NO

DETERMINISM:
PASS

GATE:
BLOCKED

NEXT:
Prepare and approve a non-Production rebuild/reconstruction plan with data/auth/storage impact review, then rerun schema reconciliation before Phase 7.4J implementation.
