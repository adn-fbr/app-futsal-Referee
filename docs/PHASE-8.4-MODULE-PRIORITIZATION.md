# Module Prioritization

| Tier | Modules | Current status | Next smallest increment |
|---|---|---|---|
| Tier 1 | Auth/Identity, Events, Event Assignments, Referees, Users/RBAC | COMPLETE/PARTIAL/BLOCKED | fixture + RLS/browser proof; contract-safe core mutations |
| Tier 2 | Evaluations, Honors, Notifications, Audit Logs, Export/Import | PARTIAL | privileged integration and error/retry coverage |
| Tier 3 | Learning, Reviews, Analytics/Reports, Organization | PARTIAL | canonical data/error/accessibility validation |
| Tier 4 | Discussions, Settings schema resolution, orphan pages, advanced assignment templates | BLOCKED/MISSING/PARTIAL | contract decisions/product scope before building |

Do not expand Tier 3/4 while Event Assignment and canonical contract gaps remain unresolved.
