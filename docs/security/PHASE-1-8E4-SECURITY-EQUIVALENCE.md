# Phase 1.8E.4 Security Equivalence

## Status

**BLOCKED — no test baseline exists.**

## Production security reference

- RLS enabled on 27/27 public tables.
- 86 policies.
- 47 public functions; 41 SECURITY DEFINER.
- `app_role`: five values.
- 3 security-invoker views.
- Broad table grants to `anon`, `authenticated`, and `service_role`.

## Required comparison

1. RLS enabled and forced state.
2. Policy table, name, command, roles, `USING`, and `WITH CHECK` expressions.
3. Function signatures, security mode, owner, search path, definitions, and EXECUTE ACLs.
4. Enum values and dependent role semantics.
5. Security-invoker view settings.
6. Trigger and audit paths.
7. Table, sequence, schema, view, and function grants.
8. Regional/resource foreign-key relationships.

## Known weaknesses to reproduce, not fix

Broad policies using `USING (true)`/`WITH CHECK (true)`, broad table grants, exposed SECURITY DEFINER functions with `search_path = public`, and incomplete ACL evidence are baseline review items. They must not be silently remediated during reconstruction.

## Current result

Security equivalence: **BLOCKED**. There is no deployed test catalog to compare, and exact target SQL identity/ACL evidence remains incomplete.
