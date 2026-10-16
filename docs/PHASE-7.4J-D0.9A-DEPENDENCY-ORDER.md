# PHASE 7.4J-D0.9A Dependency Order

Status: **VALIDATED PROPOSAL; NOT EXECUTED**.

The canonical dependency graph records 351 dependencies: 282 resolved, 47 unresolved, and 22 external-managed. The deterministic order is:

1. Extensions.
2. Enum types: `app_role`, `pengurus_level`.
3. Independent reference tables: `provinsi`, `kabupaten_kota`.
4. External Auth boundary: `auth.users` remains managed.
5. Identity-dependent tables: `profiles`, `user_roles`, `pengurus`.
6. Primary application tables and workflow tables.
7. Foreign keys, PK/UNIQUE/CHECK constraints.
8. Indexes.
9. Functions, preserving canonical identities and security declarations.
10. Security-invoker views.
11. Triggers.
12. RLS policies.

No step was executed.