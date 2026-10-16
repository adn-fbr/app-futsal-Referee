# PHASE 7.4J-D0.8 — REMOTE NON-PRODUCTION SCHEMA & EMPTY-STATE EVIDENCE

STATUS: BLOCKED

CLI TARGET: `shorsqyycpptxcutrqrb`
NON-PRODUCTION: `shorsqyycpptxcutrqrb`
PRODUCTION: `xfscfjwapwnkiinkgbjg`

REMOTE DATABASE:
ACCESS: REMOTE_DATABASE_ACCESSIBLE
STATUS: reachable through read-only migration listing, table stats, schema-only dump, and aggregate REST counts

REMOTE SCHEMA:
TABLES: 6 public tables
COLUMNS: 48 public columns
FUNCTIONS: 3 public functions; 24 functions total in included dump
VIEWS: 1 public view
TRIGGERS: 4 public triggers
INDEXES: 0 explicit public indexes in dump; primary-key indexes are constraint-backed
RLS: 6 enabled public tables; 23 public policies
EXTENSIONS: UNKNOWN; no CREATE EXTENSION statements in dump

EVENTS:
EXISTS: YES
deleted_at: ABSENT
kabupaten_kota_id: ABSENT
RLS: ENABLED; 4 policies
STATUS: DRIFTED / BLOCKED

IDENTITY:
profiles: EXISTS, 12 columns, 0 rows, RLS enabled, 5 policies
user_roles: EXISTS, 3 columns, 0 rows, RLS enabled, 2 policies
pengurus: ABSENT; REST returned 404

DATA:
CLASSIFICATION: UNKNOWN with observable empty existing application tables
DISPOSITION: BLOCKED; no data provenance or safe-discard authorization

AUTH:
STATUS: AUTH_BOUNDARY_AVAILABLE; auth.users exists in schema dump, user state not enumerated

STORAGE:
STATUS: STORAGE_PARTIAL; storage schema present, bucket count 0

RLS:
STATUS: RLS_PARTIAL

DUPLICATE FUNCTION:
canonical: ABSENT — public.check_duplicate_event(text,text,text)
rich_search: ABSENT

MIGRATION HISTORY:
LOCAL: 55
REMOTE: 4
STATUS: DIVERGED / PARTIAL

MATERIAL CONFLICTS:
COUNT: 3
STATUS: UNRESOLVED; local-only, canonical-reconstruction, and remote-target-state combination

CANONICAL COMPARISON:
MATCH: project identity, managed Auth boundary, partial early objects
MISSING: at least 21 canonical public tables, required Events columns, canonical duplicate function, and later contract objects
EXTRA: no application extras classified; managed Auth/Storage objects excluded
DRIFTED: Events, Profiles, migration history, functions, views, triggers, indexes, RLS/policies
UNKNOWN: complete extensions and full object-by-object security attributes

RECONSTRUCTION:
STATUS: BLOCKED
STRATEGY: GOVERNANCE_REQUIRED

D1:
BLOCKED

PRODUCTION:
ACCESS: NO
MUTATION: NO
DEPLOYMENT: NO

MUTATION COUNTERS:
DATABASE INSERT/UPDATE/DELETE/UPSERT/DDL: 0
MIGRATION_EXECUTION/DB_PUSH/DB_RESET/REBUILD/SEED: 0
AUTH_MUTATION/STORAGE_MUTATION/RLS_MUTATION: 0
PRODUCTION_MUTATION/PRODUCTION_DEPLOYMENT/BASELINE_MODIFICATION/APPLICATION_IMPLEMENTATION: 0
DOCKER_MUTATION: 1 — schema-only dump automatically pulled the required Postgres image

BASELINE:
UNCHANGED

DETERMINISM:
PASS

NEXT GATE: governance-approved remote non-production reconstruction plan; do not execute reconstruction, migration, repair, seed, Auth, Storage, RLS, or application changes.