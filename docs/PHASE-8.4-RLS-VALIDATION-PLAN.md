# Phase 8.4 RLS Validation Plan

## Scope

Read/update behavior for `event_assignments`, plus related `events`, `profiles`, and `user_roles`. No RLS changes are authorized.

## Matrix

| Identity | Read assignment | Update pending authorized row | Expected |
|---|---|---|---|
| Admin Provinsi | contract-dependent/authorized fixture | pending -> confirmed only | allow if canonical policy permits |
| Non-admin | contract-dependent | deny | no row mutation |
| Anonymous | deny unless public contract | deny | redirect/API denial |

## Assertions

- Application role check and database/RLS denial both observed.
- Update targets one canonical assignment ID.
- `event_id` and `referee_id` remain unchanged.
- Wrong password causes zero update.
- Audit and notification behavior is recorded only if canonical mechanisms exist.
- Restore synthetic fixture to exact original state.

## Blockers

Current plan cannot execute until approved identities, assignment fixture, current schema/RLS evidence, and browser harness exist.
