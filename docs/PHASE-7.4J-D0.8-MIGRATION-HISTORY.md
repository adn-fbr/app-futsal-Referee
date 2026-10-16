# PHASE 7.4J-D0.8 Migration History

## Comparison

- Local migration files: 55.
- Remote applied migration versions: 4.
- Remote versions: `20260103052354`, `20260103052405`, `20260103055754`, `20260103055804`.
- Local and remote history status: **DIVERGED / PARTIAL**.

The first four local migrations align with remote history. The remaining 51 local files are not recorded remotely. The remote schema is correspondingly a partial early schema: it lacks many canonical application tables and the Events columns required by the later candidate migration.

No migration was pushed, repaired, marked applied, reset, or executed.