# Phase 7.4J-D0.2 Dependency Rebuild Order

Proposed order, not executed:

1. Extensions.
2. Enum/types.
3. Tables.
4. Primary/unique/check constraints.
5. Foreign keys.
6. Functions that do not depend on later tables.
7. Indexes.
8. Triggers.
9. RLS and policies.
10. Views.
11. Required reference seed.
12. Auth-linked profiles/roles through approved mechanisms.
13. Test fixtures.
14. Schema/type/RLS verification.

Exact ordering remains blocked until the complete migration conflict set and target state are verified.
