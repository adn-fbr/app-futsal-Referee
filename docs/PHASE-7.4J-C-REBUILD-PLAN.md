# PHASE 7.4J-C Rebuild / Reconstruction Plan

## Status

**BLOCKED — PLAN AND IMPACT ASSESSMENT ONLY**

Recommended strategy: **CLEAN_REBUILD**, pending explicit execution approval and completion of data/auth/storage assessment.

## Preconditions

- Non-Production binding verified: `shorsqyycpptxcutrqrb`.
- Production `xfscfjwapwnkiinkgbjg` remains locked and untouched.
- Contract hash verified: `7ccbcced5b3ebfd74b5eb4e60c6c89c8f878a4a1162f312c51121ad6a7ed4bc6`.
- Docker daemon responds, but prior pg_dump failed on overlayfs and C: has approximately 10.6 GB free.
- Local migration set: 55 files; remote history records only four versions.

## Decision

A clean reconstruction is technically plausible but not execution-ready. Data, Auth, Storage, seed, and runtime RLS state remain unresolved. No reset, push, SQL, DDL, DML, or rebuild is authorized in Phase 7.4J-C.

## Future Sequence

Verify tooling, preserve required state, confirm data/auth/storage disposition, validate migrations, isolate conflicts, reconstruct non-Production, seed reference data, verify schema/RLS/functions/indexes, regenerate types, typecheck/build, then re-enter Phase 7.4J.
