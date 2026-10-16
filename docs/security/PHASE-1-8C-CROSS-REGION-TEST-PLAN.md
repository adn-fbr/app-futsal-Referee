# Phase 1.8C Cross-Region Test Plan

## Status

**READY for isolated non-production execution; BLOCKED now.**

## Fixture graph

```text
PROVINSI_A -> KAB/KOTA_A -> USER_A -> RESOURCE_A
PROVINSI_B -> KAB/KOTA_B -> USER_B -> RESOURCE_B
```

Use actual runtime relationships: `profiles.kabupaten_kota_id`, `kabupaten_kota.provinsi_id`, event region, assignment event/referee links, honor event/referee links, and evaluation event/referee links.

## Assertions

| Actor | Scope | Expected |
| --- | --- | --- |
| USER_A | REGION_A resources | ALLOW where role permits |
| USER_A | REGION_B resources | DENY |
| USER_B | REGION_A resources | DENY |
| USER_B | REGION_B resources | ALLOW where role permits |

Repeat through direct PostgREST/RLS access and applicable Edge Functions. Test known foreign UUIDs to prove non-obscurity isolation.

## Preconditions

Owner-confirmed isolated non-production project, two regions, two users, and deterministic resources. Do not construct this graph remotely in the unknown project.
