# Next 10 Development Tasks

| Rank | Task | Module | Priority | Why now | Dependency | Complexity |
|---:|---|---|---|---|---|---|
| 1 | Provision approved Non-Production Auth identities and reversible assignment fixture | Environment/Auth/Assignments | P0 | Browser/RLS/mutation validation is currently blocked | operator credential/fixture authorization | Medium |
| 2 | Run Admin Provinsi, non-admin, anonymous RLS and mutation tests | Event Assignments | P0 | Core status mutation is not integration-proven | Task 1 | High |
| 3 | Reconcile `check_duplicate_event` caller with canonical boolean RPC | Events | P1 | Confirmed API contract mismatch can break duplicate protection | canonical contract decision | Medium |
| 4 | Resolve `increment_view_count` and `public_system_settings` ownership | Discussions/Settings | P1 | Confirmed schema gaps block runtime confidence | governance decision | Medium |
| 5 | Complete assignment audit/notification/cache/revalidation validation | Event Assignments | P1 | Data integrity and user feedback depend on it | Task 2 | High |
| 6 | Create shared role capability matrix and direct URL tests | Auth/RBAC | P1 | Prior CTA/menu drift proves policy duplication risk | role contract | Medium |
| 7 | Add repositories for events/assignments/users incrementally | Architecture | P1 | 233 direct table calls make contracts and RLS hard to audit | Tasks 2–4 | High |
| 8 | Add browser, responsive, keyboard, accessibility, and retry regression harness | Testing/UX | P1 | No browser harness exists; UAT evidence is incomplete | Task 1 | High |
| 9 | Establish lint baseline disposition and generated inventories | DevOps/Governance | P2 | 66/11 lint debt and stale inventories reduce release signal | ownership decision | Medium |
| 10 | Measure pagination/cache/bundle/list performance and fix evidence-backed hotspots | Performance | P2 | Build warns on chunk size; list scale is not measured | core workflows stable | Medium |

### Besok

The first work should be fixture authorization and Non-Production RLS/mutation proof, not cosmetic UI. The repository already demonstrates substantial UI implementation; the blocking uncertainty is integration, contract, and authorization evidence.
