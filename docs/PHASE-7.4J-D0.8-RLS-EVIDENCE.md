# PHASE 7.4J-D0.8 RLS Evidence

STATUS: RLS_PARTIAL

## Present public tables

| Table | RLS | Policy count | Evidence |
|---|---:|---:|---|
| `events` | enabled | 4 | admin insert/delete/update; authenticated select |
| `profiles` | enabled | 5 | admin and self/profile visibility policies |
| `user_roles` | enabled | 2 | admin and self-role visibility policies |
| `event_assignments` | enabled | 2 | admin and referee visibility policies |
| `honors` | enabled | 6 | admin and referee operation policies |
| `referee_reviews` | enabled | 2 | anon/authenticated insert and select |

Remote public dump counts: 6 RLS-enabled public tables and 23 public policies. The requested missing application tables have no remote RLS evidence because the tables are absent. Storage object policies exist separately.

USING and WITH CHECK predicates are present in the dump for the observed policies. The complete canonical 27-table/86-policy contract is not present remotely. No RLS policy was changed.

Classification: **RLS_PARTIAL**.