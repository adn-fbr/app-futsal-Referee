# PHASE-7.4A Check Duplicate Event Analysis

Version: v1.0.0
Status: BLOCKED

## Call-site inventory

There is one application runtime call-site: `src/hooks/useEvents.ts:556`, inside `useCheckDuplicateEvent`, called by `src/pages/EventEdit.tsx:34` and executed from `EventEdit.tsx:83` during event editing. The hook accepts the same input shape for any consumer, but repository-wide search found no second application `.rpc("check_duplicate_event")` call.

Related contract evidence is not a runtime call-site: the immutable baseline and dependency graph define a three-argument function; historical migration `supabase/migrations/20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql:101` defines a five-argument function; generated types expose the five-argument return-row shape; bundled assets contain the same application call.

## Application operation

The call sends five named arguments:

`p_name: name`, `p_date: date`, `p_location: location || null`, `p_kabupaten_kota_id: kabupatenKotaId || null`, and `p_exclude_event_id: excludeEventId || null`.

The caller obtains `name`, `date`, and optional `location`/region from the event form. `excludeEventId` is the current event id when editing. The hook expects duplicate rows with `id`, `name`, `date`, `location`, `status`, and `similarity_score`, then returns `{ isDuplicate, duplicates }`.

Business purpose: warn before creating or updating an event when another event has a similar name/date/location/region, while excluding the current event during edit.

## Canonical baseline operation

The immutable baseline defines exactly:

`public.check_duplicate_event(p_kota_id text, p_location text, p_name text) RETURNS boolean`

Its body checks whether an event exists where `kota_id::text`, `location`, and `name` match. It does not accept date, region id under the application name, or exclude-event id, and it does not return duplicate rows or similarity scores.

## Comparison

The five-argument application contract is not equivalent to the canonical three-argument contract plus redundant values. Date proximity, region filtering, exclusion of the current event, similarity scoring, row details, and boolean-vs-table return behavior are material business semantics. A three-argument adapter would lose behavior; a five-argument implementation would require a different database contract.

Decision: `CONTRACT_REQUIRES_GOVERNANCE_DECISION`. Evidence establishes two legitimate historical/application shapes but does not establish which contract governs authorized Production behavior.

## Safety

No source, generated type, SQL, migration, baseline, dependency graph, database, or Production environment was modified or accessed.
