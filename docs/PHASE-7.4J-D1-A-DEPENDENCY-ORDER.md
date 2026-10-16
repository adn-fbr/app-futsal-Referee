# PHASE 7.4J-D1-A DEPENDENCY ORDER

## Canonical reconstruction sequence

The future executor must validate dependency edges before execution and must not use arbitrary alphabetical ordering where dependency order is required.

1. extensions
2. enum types
3. reference/base tables
4. identity-dependent tables
5. application tables
6. primary keys and unique constraints
7. foreign keys
8. indexes
9. functions
10. views
11. triggers
12. RLS policies

## Critical constraints

- Preserve canonical table dependency ordering.
- Validate actual graph edges before any destructive action.
- Never assume a valid order from naming alone.
- The canonical dependency graph is the authoritative ordering source.

## Known required contract

- events.kabupaten_kota_id -> kabupaten_kota.id
- public.check_duplicate_event(text,text,text) RETURNS boolean

## Execution gate

If dependency validation fails, execution is blocked and the environment remains in a governed, non-mutating state.
