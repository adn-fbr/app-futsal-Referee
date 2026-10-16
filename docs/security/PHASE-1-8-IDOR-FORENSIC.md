# Phase 1.8 IDOR Forensic Audit

## Status

**RUNTIME BLOCKED; static attack surface mapped.** No identifiers were probed against the connected project.

## Resource matrix

| Resource | Identifier | Static ownership/scope rule | Authorization layer | IDOR status |
| --- | --- | --- | --- | --- |
| profile | `id` / `user_id` | authenticated identity or admin/region | frontend, Edge Functions, RLS | BLOCKED |
| user role | `user_id` | canonical role assignment for target user | Edge Functions/RLS | BLOCKED; P0 if ordinary caller can mutate |
| event | `id`, `kabupaten_kota_id` | event region and operator/role | Edge Functions/RLS | BLOCKED |
| assignment | `id`, `event_id`, `referee_id` | event region plus assignment/referee relation | Edge Functions/RLS | BLOCKED |
| honor | `id`, `referee_id`, `event_id` | referee ownership and workflow status | RLS/Edge Functions | BLOCKED |
| evaluation | `id`, `event_id`, `referee_id`, `evaluator_id` | evaluator/referee/event scope | RLS/Edge Functions | BLOCKED |
| referee card | `id`, `referee_id`, `card_id` | card/referee relationship | RLS/RPC/Edge Functions | BLOCKED |
| regional object | `kabupaten_kota_id`, `provinsi_id` | regional hierarchy and role scope | RLS/Edge Functions | BLOCKED |
| audit log | `id`, `entity_id` | immutable system-generated record | RLS/definer/trigger | BLOCKED |

## Static observations

Frontend hooks frequently query by resource IDs. That is normal, but authorization must be enforced by the database and server layer, not by UUID obscurity or route guards. Edge handlers generally resolve caller identity from the bearer token, while request bodies still contain target IDs that require resource-scope validation.

## Required safe runtime tests

Use only isolated non-production users/resources: same-tenant authorized access, same-tenant unauthorized access, cross-region identifier access, forged `user_id`, forged role, and forged tenant. No such tests were run against the active project.

## Gate

IDOR protection is **BLOCKED**. Do not claim PASS from static query inspection.
