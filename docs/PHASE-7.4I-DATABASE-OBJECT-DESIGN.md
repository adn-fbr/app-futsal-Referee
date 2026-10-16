# PHASE 7.4I Database Object Design

## Status

**DESIGN REQUIRED — NO DATABASE OBJECT CREATED**

Physical rich-search identity, schema, signature, and return type remain **TBD**. The historical migration `20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql` is evidence only: it defines a conflicting five-argument `SECURITY DEFINER check_duplicate_event` and cannot be adopted automatically.

## Candidate Data Surface

Verified schema evidence identifies `public.events` with:

`id`, `name`, `date`, `location`, `status`, `kabupaten_kota_id`, `deleted_at`.

Existing relevant indexes are date, deleted_at, kabupaten_kota_id, and status indexes. No rich-search index is authorized.

## Query Design

The future non-Production design must support name exact/contains matching, date proximity, optional location/region filters, event exclusion, historical ranking, deterministic ordering, and a maximum of five results. Exact SQL and function identity remain design work.

## Security and RLS

Use `SECURITY INVOKER`, caller context, and existing RLS. Do not create policies, bypass RLS, or use service-role browser credentials. The baseline currently contains an events SELECT policy permitting everyone; this is schema evidence and must be revalidated in the safe target environment before implementation.

## Performance

Follow `MEASURE -> EXPLAIN -> VALIDATE -> INDEX`. No index is authorized from `pg_trgm` presence alone.

## Prohibited Actions

No `CREATE FUNCTION`, `ALTER FUNCTION`, `CREATE INDEX`, `ALTER TABLE`, migration, SQL execution, or database mutation occurred.
