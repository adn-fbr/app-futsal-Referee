# Codebase Module Inventory

## Evidence

Current executable inventory: 52 concrete routes plus catch-all, 56 page files, 33 hooks, 88 component TSX files, 6 non-test repository files, 18 Edge Function directories, and 9 test files/26 tests. Direct access counts are 233 `.from` occurrences, 25 RPC calls, 16 Edge Function invocations, and 84 `supabase.` occurrences.

## Modules

| ID | Module | Routes/pages | Primary backend | Roles | Status |
|---|---|---|---|---|---|
| M-01 | Authentication/Identity | `/login`, signup, recovery, `AuthContext` | Supabase Auth, profiles, user_roles repositories | anonymous/authenticated | COMPLETE |
| M-02 | Profile | profile completion, referee profile | profiles/hooks | authenticated | PARTIAL |
| M-03 | Events/Approvals | `/events`, submit/edit/calendar, `/approvals` | events, event_approvals, RPCs | admin, panitia | PARTIAL |
| M-04 | Event Assignments | assignment routes and admin management | event_assignments, profiles/events, direct hooks | admin roles, wasit | BLOCKED |
| M-05 | Referees | `/referees`, detail, availability | profiles, get_referees RPC | admins | PARTIAL |
| M-06 | Referee Cards | ID-card pages and verification | referee_cards, card RPCs/storage | admin/wasit/public | PARTIAL |
| M-07 | Public Reviews | review list/detail/submit | public review RPCs/tables | public/admin | PARTIAL |
| M-08 | Evaluations | list/new/detail/form | evaluations/evaluation_scores | evaluator/admin | PARTIAL |
| M-09 | Honors | referee/admin honor pages | honors/active_honors | wasit/admin | PARTIAL |
| M-10 | Learning | learning modules/detail/admin | learning_materials/progress | wasit/admin | PARTIAL |
| M-11 | Discussions | discussion list/detail/new/admin | discussion_topics/replies; `increment_view_count` | wasit/admin | BLOCKED |
| M-12 | Organization/Pengurus | organization/admin surfaces | pengurus/regional hooks, some static data | admins | PARTIAL |
| M-13 | Notifications | notifications/preferences/reminders | notifications + Edge Functions | authenticated | PARTIAL |
| M-14 | Analytics/Reports | analytics and report routes | RPC/direct aggregates | admins | PARTIAL |
| M-15 | Users/Approvals | user management/approval | profiles/user_roles + Edge Functions | admin | PARTIAL |
| M-16 | Audit/Auth Logs | audit/auth logs | audit_logs/auth_event_logs | admins | PARTIAL |
| M-17 | Export/Import | `/export` | export/import Edge Functions | admin_provinsi | PARTIAL |
| M-18 | Settings | `/settings` | system_settings + historical view | admin_provinsi | BLOCKED |
| M-19 | Public Verification | `/verify/:code` | verification RPC/logs | public | PARTIAL |
| M-20 | Orphan Pages | Bookings, Courts, Teams, Index | no executable route evidence | unknown | MISSING |

## Backend Layers

Repositories exist only for Auth, Profile, and Role. Business domains are implemented mostly as hooks with direct Supabase calls. Edge Functions cover user administration, notifications, reporting/export/import, reminders, auto-completion, email configuration, and seed tooling. No general repository/service layer or repository provider exists.

## Governance Notes

The older Phase 8.1 inventory reports 55 pages and 51 routes; current source reports 56 pages and 52 concrete routes. The inventory is therefore itself a documentation gap and must be regenerated before relying on it as a release control.
