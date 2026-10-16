# PHASE 7.4J-D0.9 — NON-PRODUCTION RECONSTRUCTION SPECIFICATION

STATUS: BLOCKED

CLI TARGET: `shorsqyycpptxcutrqrb`
NON-PRODUCTION: `shorsqyycpptxcutrqrb`
PRODUCTION: `xfscfjwapwnkiinkgbjg`

CANONICAL TARGET:
Tables: 27
Columns: 249
Functions: 47
Views: 3
Triggers: 22
Indexes: 47
RLS: 86 policies
Extensions: 7; enum types: 2

REMOTE CURRENT:
Tables: 6
Columns: 48
Functions: 3 public / 24 included dump
Views: 1
Triggers: 4
RLS: 6 tables / 23 policies

REMOTE VS CANONICAL:
MATCH: partial early objects and project identity
MISSING: canonical tables, Events fields, duplicate function, later contract objects
DRIFTED: Events, Profiles, User Roles, migration history, functions, views, triggers, RLS
EXTRA: none classified; managed Auth/Storage excluded
UNKNOWN: complete extensions and unresolved remote object details

MIGRATIONS:
LOCAL: 55
REMOTE: 4
MATERIAL CONFLICTS: 3
CLASSIFICATION: classified but unresolved; isolate/review/reject dispositions

DATA:
STATUS: observable empty subset; whole-database provenance unresolved
DISPOSITION: GOVERNANCE_REQUIRED

AUTH:
STATUS: external-managed boundary
STRATEGY: synthetic identities only, linked to synthetic profiles/roles

STORAGE:
STATUS: schema present, zero buckets
STRATEGY: governed synthetic buckets/files/signed-url fixtures only

RLS:
STATUS: canonical source deterministic; execution target not yet approved

EVENTS:
STATUS: canonical target deterministic; remote missing deleted_at and kabupaten_kota_id

RECONSTRUCTION OPTIONS:
A: canonical baseline reconstruction — preferred
B: curated migration reconstruction — blocked
C: hybrid canonical baseline plus validated future migrations — future maintenance model

RECOMMENDED METHOD: OPTION A, followed by governed OPTION C

DEPENDENCY ORDER:
STATUS: deterministic proposed order from dependency graph; not executed

ROLLBACK:
STATUS: required before execution; approved snapshot or isolated-project replacement not yet defined

EXECUTION AUTHORIZATION:
NOT GRANTED

PRODUCTION:
ACCESS: NO
MUTATION: NO
DEPLOYMENT: NO

DATABASE MUTATION:
0

BASELINE:
UNCHANGED

DETERMINISM:
PASS

D1: BLOCKED

NEXT GATE: approve data disposition, Storage/Auth fixture policy, conflict dispositions, rollback design, and a separate execution authorization. Do not execute the selected method in D0.9.

Safety counters: INSERT 0; UPDATE 0; DELETE 0; UPSERT 0; DDL 0; migration execution 0; DB_PUSH 0; DB_RESET 0; rebuild 0; seed 0; Auth mutation 0; Storage mutation 0; RLS mutation 0; Production mutation 0; Production deployment 0; baseline modification 0; application implementation 0. Docker infrastructure side effect: 1 previously recorded image pull from D0.8.