# PHASE-7.4E-C Evidence Trace

Version: v1.0.0

| Evidence ID | Source | Supports | Authority |
| --- | --- | --- | --- |
| E-001 | `CANONICAL-RUNTIME-BASELINE.sql` function definition | Three-argument canonical identity, boolean return, exact EXISTS body | Production canonical |
| E-002 | `PRODUCTION-FULL-DEPENDENCY-GRAPH.json` | Canonical function identity and dependency evidence | Production dependency evidence |
| E-003 | `production-schema.sql` | Same three-argument function definition | Production schema artifact |
| E-004 | `supabase/migrations/20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql` | Historical five-argument signature, TABLE fields, CASE scoring, ordering, LIMIT 5 | Historical only |
| E-005 | `src/hooks/useEvents.ts:541-570` | Current five-argument call and DuplicateEvent mapping | Application evidence |
| E-006 | `src/pages/EventEdit.tsx:87-106` | Input origin, first-row display, error-to-allow behavior | Application evidence |
| E-007 | `src/integrations/supabase/types.ts:1430-1445` | Generated five-argument row-returning type conflict | Application evidence only |
| E-008 | Repository-wide search | One runtime application call-site; no pg_trgm similarity call or threshold constant | Application evidence |
| E-009 | `CANONICAL-RUNTIME-BASELINE-MANIFEST.json` | Baseline SHA-256 and immutable catalog contract | Baseline governance |

No Test/Staging database evidence was used. No source, SQL, migration, baseline, dependency graph, or database was changed.
