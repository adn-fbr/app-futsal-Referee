# Phase 8.5D Canonical Function Forensics

Status: BLOCKED
Environment inspected: `shorsqyycpptxcutrqrb` only. No database or application mutation was performed.

## Finding

The frozen canonical identity is `public.check_duplicate_event(text,text,text) RETURNS boolean`. Its definition in `production-schema.sql` is a `VOLATILE SECURITY DEFINER` PL/pgSQL function whose body selects from `events` and compares `kota_id`, `location`, and `name` exactly.

The canonical `events` table defines `kabupaten_kota_id uuid`, with a foreign key to `public.kabupaten_kota(id)`, and has no `kota_id` column. The same canonical schema, dependency graph, generated linked signature, and application model consistently expose `kabupaten_kota_id`, not `kota_id`.

The historical migration `20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql` instead defines a five-argument, row-returning similarity search. The active application caller follows that historical contract. These are incompatible contracts.

## Decision

`MULTI-LAYER CONTRACT CONFLICT`

The evidence proves a function/schema/caller conflict, but does not prove whether `p_kota_id` was intended to mean the canonical regional FK, a distinct city identifier, or an obsolete field. Phase 8.5D therefore does not authorize a function fix, schema change, or application adaptation.

## Runtime note

Linked type generation was safely run against `shorsqyycpptxcutrqrb` and confirmed the three-string/boolean identity. No controlled RPC invocation was performed: the offline canonical body contains an unresolved column reference, and no authorized SQL query channel was available for a body-level Non-Production catalog inspection. The static body is sufficient to classify execution as unsafe to rely on.

## Safety

Production queries, mutations, schema changes, function changes, Auth changes, deployments, and fixtures: 0. Non-Production mutations: 0. Production UAT remains `NOT READY`.
