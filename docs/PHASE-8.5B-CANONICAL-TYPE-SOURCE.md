# Phase 8.5B Canonical Type Source

## Current source chain

Canonical DB contract is documented in `production-schema.sql` and the canonical inventory. Runtime generated TypeScript is `src/integrations/supabase/types.ts`, but its `check_duplicate_event` entry is stale and represents the historical five-argument/array contract.

No package script currently provides an approved canonical type-generation command. `supabase/.temp/project-ref`/`config.toml` identify Non-Production runtime binding, but type generation must not silently use Production and must not assume remote schema equals canonical baseline.

## Strategy

1. Obtain explicit canonical type source approval: reviewed canonical schema snapshot or verified Non-Production schema known to match canonical baseline.
2. Use Supabase CLI type generation against that source only; record command, target, hash/provenance, and diff.
3. Verify generated `Functions.check_duplicate_event` is three text args and boolean return.
4. Update application caller and UI to boolean semantics.
5. Add contract tests asserting no five-arg caller/rich result expectation remains.
6. Run typecheck/tests/build and inspect generated diff.

## Not executed

No type generation, remote schema query, migration, RPC, or generated-type edit was performed. Manual editing is explicitly rejected.
