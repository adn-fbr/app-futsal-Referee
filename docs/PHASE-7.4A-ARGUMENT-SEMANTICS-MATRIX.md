# PHASE-7.4A Argument Semantics Matrix

Version: v1.0.0
Status: BLOCKED

## Application five-argument matrix

| Position | Source expression | Type | Semantic meaning | Evidence |
| --- | --- | --- | --- | --- |
| 1 | `p_name: name` | `string` | Event name used for exact/contains name similarity | `useEvents.ts` mutation input; `EventEdit.tsx` passes `formData.eventName` |
| 2 | `p_date: date` | `string` formatted `yyyy-MM-dd` | Event date used for exact/proximity matching | `useCheckDuplicateEvent` input; caller formats `startDate` with `format(..., "yyyy-MM-dd")` |
| 3 | `p_location: location || null` | `string | null` | Optional event location used in exact location comparison | Form `location` field; historical five-argument function compares location when non-null |
| 4 | `p_kabupaten_kota_id: kabupatenKotaId || null` | `string | null` | Optional regional object id restricting candidate events | Form `kabupatenKotaId` is selected from region data; historical function filters `events.kabupaten_kota_id` |
| 5 | `p_exclude_event_id: excludeEventId || null` | `string | null` | Current event id excluded during edit to avoid self-match | `EventEdit.tsx` passes route `eventId`; historical function excludes matching event id |

All five semantics are resolved from source flow and the historical function body. They are not semantics of the canonical baseline function.

## Canonical three-argument matrix

| Position | Baseline parameter | Type | Semantic meaning | Evidence |
| --- | --- | --- | --- | --- |
| 1 | `p_kota_id` | `text` | Text representation of the event `kota_id` used in existence check | Immutable baseline function body: `kota_id::TEXT = p_kota_id` |
| 2 | `p_location` | `text` | Exact event location comparison | Immutable baseline body: `location = p_location` |
| 3 | `p_name` | `text` | Exact event name comparison | Immutable baseline body: `name = p_name` |

Canonical return is `boolean` from `EXISTS`; it has no date, exclusion, region-id, similarity, or duplicate-row output.

## Semantic result

Application arguments: `RESOLVED` individually.

Canonical arguments: `RESOLVED` individually.

Mapping between contracts: `UNRESOLVED` without governance because position 2/4/5 and return semantics cannot be safely discarded or transformed without business-logic loss.
