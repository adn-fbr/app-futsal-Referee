# PHASE 8.3E.1 — Fixture Cleanup Plan

## Status

**BLOCKED — NO FIXTURES CREATED**

No Auth users, profiles, roles, events, assignments, or other application records were created or mutated in this phase. No cleanup operation is required and no remote cleanup command was executed.

## Required Cleanup Inventory Before Future Fixture Creation

The authorized operator must record only non-sensitive identifiers after proving the target is `shorsqyycpptxcutrqrb`:

- synthetic Auth Identity A ID
- synthetic Auth Identity B ID
- synthetic profile IDs
- synthetic `user_roles` row IDs or user/role pairs
- synthetic event ID
- synthetic `event_assignments` ID

Passwords, tokens, JWTs, session cookies, and service-role credentials must never be recorded.

## Reversible Order

1. Restore the assignment row to its exact original status and verify `event_id` and `referee_id` are unchanged, if the row existed before the test.
2. Delete only the synthetic `event_assignments` row created by the fixture plan.
3. Delete only the synthetic event created by the fixture plan.
4. Delete only synthetic role/profile records created by the fixture plan, respecting foreign keys.
5. Delete only synthetic Auth identities created by the fixture plan through the approved Non-Production Auth mechanism.
6. Re-read the known synthetic identifiers and verify no unrelated records were affected.

No step may run against Production. No bulk delete, schema change, RLS change, or service-role browser operation is permitted.

## Current Counters

- Auth fixtures created: 0
- Application fixtures created: 0
- Remote cleanup operations: 0
- Production cleanup operations: 0
