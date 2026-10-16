# PHASE-7.4A Historical Contract Evidence

Version: v1.0.0
Status: BLOCKED

## Historical migration

`supabase/migrations/20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql:101` defines:

`check_duplicate_event(p_name TEXT, p_date DATE, p_location TEXT DEFAULT NULL, p_kabupaten_kota_id TEXT DEFAULT NULL, p_exclude_event_id TEXT DEFAULT NULL)`

It returns a table containing `id`, `name`, `date`, `location`, `status`, and `similarity_score`. The body applies name similarity, date proximity, optional location and region filtering, and current-event exclusion.

This is direct historical evidence for the application five-argument contract. It is not current Production truth because the immutable baseline and dependency graph define a different function identity.

## Canonical evidence

The immutable `CANONICAL-RUNTIME-BASELINE.sql` and `PRODUCTION-FULL-DEPENDENCY-GRAPH.json` define only:

`public.check_duplicate_event(text,text,text) RETURNS boolean`

with parameters `p_kota_id`, `p_location`, and `p_name`. The supplied production schema dump contains the same three-argument definition. No five-argument function appears in those canonical artifacts.

## Git history

`git log`, `git log -S`, and `git blame` found the application hook and its five-argument call introduced in commit `cb5098f`. No earlier local revision with an alternative application signature was found. The historical migration is the only local five-argument SQL definition found.

Git evidence confirms lineage, not current Production validity.

## Generated types

`src/integrations/supabase/types.ts` exposes the five-argument application shape and duplicate-row return type. This is recorded as `TYPE_CONTRACT_MISMATCH`; generated types cannot override the immutable baseline and were not modified.

## Non-production evidence

No authorized `.env.test` or `.env.staging` configuration was present, no database connection was established, and no Test/Staging inspection was authorized or performed. Result: `NO_EVIDENCE`.

## Conclusion

Evidence confirms two materially different contracts. It does not prove stale application code, Production schema gap for the five-argument contract, or safe adaptation to the three-argument function.
