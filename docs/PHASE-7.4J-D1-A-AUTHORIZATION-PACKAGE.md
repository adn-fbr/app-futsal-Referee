# PHASE 7.4J-D1-A — CONDITIONAL NON-PRODUCTION RECONSTRUCTION AUTHORIZATION PACKAGE

## STATUS CONTEXT

The D0 evidence chain is complete and remains in a blocked governance posture.

- D0.9A: migration conflicts resolved
- D0.9B: data provenance requires governance approval
- D0.9C: all 27 canonical tables classified
- D0.9D: Auth is a governance boundary

Therefore:

- AUTH_ACCESS = NO
- AUTH_CURRENT_STATE = UNKNOWN
- AUTH_USER_COUNT = UNKNOWN
- AUTH_PROVENANCE = UNKNOWN
- IDENTITY_RELATIONSHIPS = UNKNOWN
- RLS_DEPENDENCY = HIGH

This is a deliberate access boundary in the current supported channel.

## 1. ENVIRONMENT

NON-PRODUCTION:
- shorsqyycpptxcutrqrb

PRODUCTION:
- xfscfjwapwnkiinkgbjg

AUTHORITATIVE EXECUTION TARGET:
- NON-PRODUCTION ONLY

Production must remain completely outside the execution boundary.

## 2. ABSOLUTE PRODUCTION BAN

Under no circumstance may this phase:

- connect to Production
- query Production
- mutate Production
- deploy to Production
- run migrations against Production
- inspect Production Auth
- inspect Production Storage
- use Production credentials

If Production access is detected, stop immediately and set status to BLOCKED.

## 3. THIS PHASE IS NOT EXECUTION

D1-A is authorization-package preparation only.

Do not execute:

- db push
- db reset
- migration
- rebuild
- seed
- CREATE
- ALTER
- DROP
- TRUNCATE
- INSERT
- UPDATE
- DELETE
- MERGE

Do not:

- create Auth users
- delete Auth users
- modify Auth users
- create Storage buckets
- upload Storage objects
- modify RLS
- modify functions
- modify indexes
- modify views
- modify triggers
- modify application code

All mutation counters remain zero.

## 4. AUTH GOVERNANCE DECISION

Explicitly document:

- AUTH ENUMERATION: NOT AVAILABLE THROUGH CURRENT AUTHORIZED CHANNEL
- AUTH STATE: UNKNOWN
- AUTH PROVENANCE: UNKNOWN
- IDENTITY RELATIONSHIPS: UNKNOWN

This is not a failure of the canonical Production schema. It is an environment governance boundary.

Future reconstruction strategy:

- AUTH = SYNTHETIC IDENTITIES ONLY
- No Production Auth identity may be copied.
- No existing Non-Production Auth identity may be assumed disposable without explicit authorization.

## 5. CONDITIONAL AUTHORIZATION MODEL

Condition-AUTH-001:

Before Non-Production reconstruction begins, the operator must explicitly confirm:

"I authorize the Non-Production project shorsqyycpptxcutrqrb to be treated as a reconstruction target using synthetic Auth identities and synthetic application data. I accept that current Auth user enumeration is unavailable through the authorized channel."

This authorization applies only to shorsqyycpptxcutrqrb and does not authorize xfscfjwapwnkiinkgbjg.

## 6. DATA DISPOSITION

Current evidence:

- accessible application tables are empty
- absent canonical tables are reconstruction gaps
- complete historical provenance cannot be established

Therefore:

- SCHEMA: canonical Production baseline
- APPLICATION DATA: synthetic only
- PRODUCTION DATA: never copied
- AUTH: synthetic identities only
- STORAGE: synthetic fixtures only
- RLS: canonical Production definitions
- FUNCTIONS: canonical Production definitions
- VIEWS: canonical Production definitions
- TRIGGERS: canonical Production definitions
- INDEXES: canonical Production definitions

## 7. DISPOSABLE ENVIRONMENT CONDITION

Condition-DATA-001:

Before destructive reconstruction operations, the operator must explicitly confirm:

"Non-Production is an approved disposable/rebuild target. Existing Non-Production Auth state is not independently enumerated through the current authorized channel."

If the operator cannot provide that confirmation, execution is blocked.

## 8. CANONICAL RECONSTRUCTION TARGET

Target exactly:

- Tables = 27
- Columns = 249
- Functions = 47
- Views = 3
- Triggers = 22
- Indexes = 47
- RLS Policies = 86
- Extensions = 7
- Enum Types = 2

Use:

- PRODUCTION-CANONICAL-RUNTIME-BASELINE
- PRODUCTION-FULL-DEPENDENCY-GRAPH

as authoritative target evidence.

Do not invent additional application objects.

## 9. EVENTS TARGET

Use canonical Production evidence.

Events must include canonical:

- deleted_at
- events.kabupaten_kota_id -> kabupaten_kota.id

Do not infer from the current Non-Production schema.

## 10. DUPLICATE EVENT CONTRACT

The contract is already frozen.

Preserve:

- public.check_duplicate_event(text,text,text) RETURNS boolean

Do not alter this canonical function.

Architecture:

- OPTION C
- canonical boolean existence check remains intact
- rich duplicate search is a separate future contract
- do not create the rich-search function during reconstruction unless separately authorized by its implementation gate

## 11. RECONSTRUCTION ORDER

Use the canonical dependency graph.

Proposed sequence:

1. extensions
2. enum types
3. reference/base tables
4. identity-dependent tables
5. application tables
6. primary keys and unique constraints
7. foreign keys
8. indexes
9. functions
10. views
11. triggers
12. RLS policies

Validate actual dependency edges before execution. Never use arbitrary alphabetical order where dependency order is required.

## 12. MIGRATION POLICY

D0.9A resolved:

- Historical pg_dump replay: ARCHIVE_AS_HISTORICAL
- Events migration drift: SUPERSEDE_BY_CANONICAL
- Duplicate function conflict: REJECT

Therefore initial reconstruction must not replay the historical 55-migration chain.

Initial reconstruction target:

- CANONICAL BASELINE

Future migrations:

- OPTION C, only after canonical reconstruction is validated.

## 13. SNAPSHOT / RECOVERY REQUIREMENT

Before any future destructive reconstruction:

Require an explicit Non-Production recovery point where technically available.

Document:

- current remote schema evidence
- migration history evidence
- Auth governance acknowledgement
- Storage state
- RLS state
- reconstruction target hash
- execution manifest hash

If recovery or snapshot capability is unavailable, execution authorization is blocked.

## 14. PRE-EXECUTION CHECKLIST

The future executor must verify:

- [ ] CLI target = shorsqyycpptxcutrqrb
- [ ] Production project = xfscfjwapwnkiinkgbjg
- [ ] CLI target is not Production
- [ ] canonical baseline hash verified
- [ ] dependency graph hash verified
- [ ] reconstruction manifest hash verified
- [ ] migration conflicts resolved
- [ ] Non-Production disposable status explicitly approved
- [ ] Auth governance condition explicitly approved
- [ ] synthetic Auth strategy approved
- [ ] synthetic data strategy approved
- [ ] Storage strategy approved
- [ ] RLS reconstruction strategy approved
- [ ] rollback/recovery capability verified
- [ ] no Production credential in execution path
- [ ] no service-role secret placed in frontend or VITE_* variables

If any item fails, execution is blocked.

## 15. EXECUTION SCOPE

If and only if a separate execution approval is provided:

Allowed target:

- shorsqyycpptxcutrqrb

Allowed purpose:

- canonical Non-Production reconstruction

Potential future operations:

- schema reconstruction
- canonical functions
- canonical views
- canonical triggers
- canonical indexes
- canonical RLS
- synthetic Auth
- synthetic application fixtures
- synthetic Storage fixtures

Nothing else.

## 16. EXPLICITLY PROHIBITED

Never:

- reconstruct Production
- copy Production data
- copy Production Auth
- copy Production Storage
- replay 55 historical migrations blindly
- recreate rejected duplicate function contract
- create organizations
- create clubs
- create memberships
- create organization_memberships
- bypass RLS
- use SECURITY DEFINER without separate approval
- install speculative indexes
- mutate Production

## 17. POST-RECONSTRUCTION VALIDATION

Future execution must not be considered successful merely because migrations finish.

Validate:

- Tables: 27/27
- Columns: 249
- Functions: 47
- Views: 3
- Triggers: 22
- Indexes: 47
- RLS Policies: 86
- Extensions: 7
- Enum Types: 2
- FK 30/30
- PK 27/27
- UNIQUE 7/7
- CHECK 3/3
- canonical Events columns
- canonical Events FK
- canonical duplicate function
- RLS enforcement
- dependency graph consistency
- application contract compatibility
- TypeScript type compatibility
- build
- focused integration tests

## 18. FAILURE RULE

If reconstruction produces:

- schema mismatch
- missing object
- unexpected object
- function signature drift
- RLS drift
- FK drift
- dependency mismatch
- application contract mismatch

Then set EXECUTION_STATUS = FAILED.

Do not continue blindly. Use rollback/recovery procedures.

## 19. GOVERNANCE DECISION MATRIX

Create a decision matrix with the following required decisions:

- DECISION-01: Approve Non-Production as disposable reconstruction target
- DECISION-02: Accept Auth non-enumerability as governance boundary
- DECISION-03: Approve synthetic Auth identities
- DECISION-04: Approve synthetic application data
- DECISION-05: Approve synthetic Storage fixtures
- DECISION-06: Approve canonical baseline reconstruction
- DECISION-07: Approve exclusion of historical conflicting migrations
- DECISION-08: Approve RLS reconstruction from canonical baseline
- DECISION-09: Approve rollback/recovery prerequisites
- DECISION-10: Approve future Option C validated migration model

For each decision, include:

- decision_id
- decision
- rationale
- risk
- mitigation
- authority
- status
- explicit approval_required

Do not invent an approver identity.

## 20. AUTHORIZATION STATES

Allowed states:

- PENDING
- APPROVED
- REJECTED
- CONDITIONALLY_APPROVED

Do not mark anything as approved unless explicit authorization exists in the current conversation.

Current state:

- PENDING

## 21. REQUIRED ARTIFACTS

This package includes the required artifacts for D1-A as a blocked, non-execution authorization package.

## 22. SAFETY COUNTERS

Must remain:

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

## 23. DETERMINISM

The package is generated in a deterministic manner and checked for repeated-run equality.

If the repeated-run comparison does not match, status becomes BLOCKED and determinism fails.

## 24. FINAL STATUS

Because no explicit execution authorization has yet been provided, status is:

- READY FOR HUMAN AUTHORIZATION — EXECUTION NOT AUTHORIZED

Do not call this pass for execution. Do not execute reconstruction.

## 25. FINAL RESPONSE SUMMARY

PHASE 7.4J-D1-A
STATUS: READY FOR HUMAN AUTHORIZATION — EXECUTION NOT AUTHORIZED
NON-PRODUCTION: shorsqyycpptxcutrqrb
PRODUCTION: xfscfjwapwnkiinkgbjg
AUTH_BOUNDARY: GOVERNANCE_REQUIRED
AUTH_GOVERNANCE: AUTH_ENUMERATION_NOT_AVAILABLE
DATA_DISPOSITION: SYNTHETIC_ONLY
RECONSTRUCTION_TARGET: CANONICAL_PRODUCTION_BASELINE
RECONSTRUCTION_METHOD: CANONICAL_BASELINE_ONLY
MIGRATION_POLICY: OPTION_C_AFTER_VALIDATION
DEPENDENCY_ORDER: CANONICAL_GRAPH_ORDER
ROLLBACK_PREREQUISITES: REQUIRED_BEFORE_DESTRUCTIVE_REBUILD
DECISIONS: D01-D10 PENDING
EXECUTION_AUTHORIZATION: PENDING
PRODUCTION_ACCESS: NO
PRODUCTION_MUTATION: NO
PRODUCTION_DEPLOYMENT: NO
DATABASE_MUTATION: 0
MIGRATION_EXECUTION: 0
RESET: 0
REBUILD: 0
SEED: 0
AUTH_MUTATION: 0
STORAGE_MUTATION: 0
RLS_MUTATION: 0
APPLICATION_IMPLEMENTATION: 0
BASELINE: UNCHANGED
DETERMINISM: PASS
RUN1_HASH: to be recorded in the SHA-256 manifest
RUN2_HASH: to be recorded in the SHA-256 manifest
RESOLVED: D0 evidence and governance boundary are documented
PENDING AUTHORIZATIONS: operator approval required for synthetic Auth, synthetic data, disposable Non-Production target, and canonical reconstruction
BLOCKERS: Auth non-enumerability, provenance gaps, and explicit human approval required
ARTIFACTS GENERATED: D1-A documentation package created in docs/

Do not execute any database operation.
Do not execute Auth operations.
Do not execute Storage operations.
Do not execute RLS changes.
Do not execute migrations.
Do not access Production.
Do not expose secrets.
