# PHASE-7.3A Batch Plan

Version: v1.0.0
Status: BLOCKED until contract blockers are resolved

No batch modifies Production or executes migrations. Each batch is a planning unit for Phase 7.4.

| Batch ID | Domain | Files | Operations | Repository | Dependencies | Auth / RLS | Risk | Test requirement | Rollback |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| B1 | Authentication / Profile / Role | Auth/Profile hooks, auth pages, import component | 41 | Extend existing Auth/Profile/Role repositories | Auth API, profiles, user_roles | Auth session; user isolation and role RLS | P0 | Auth lifecycle, IDOR, role and profile tests | Revert adapter wiring; no DB rollback |
| B2 | Events / Assignments / Approvals | `useEvents`, `useEventAssignments`, `useEventReminders`, `useSmartAssignment`, `useAutoCompleteEvents`, `EventSubmission`, related honor eligibility | 65 | Events and Assignments repositories plus function adapter | events, assignments, approvals, regions, Edge Functions | Authenticated role and regional RLS; function JWT/handler checks | P1 | Event lifecycle, assignment conflict, cross-region tests | Disable new adapter behind feature boundary |
| B3 | Referees / Cards / Reviews | Referee, card, public-review hooks | 53 | Referee, Card, Review repositories | profiles, cards, reviews, exact RPC signatures | Public read boundaries; role and ownership writes | P1-P2 | Card issuance, verification, overload and IDOR tests | Revert repository selection |
| B4 | Evaluations | `useEvaluations.ts` | 17 | Evaluation repository | evaluations, scores, criteria, events | Evaluator/referee role and event-scope RLS | P0-P1 | Cross-user and cross-event authorization tests | Revert adapter wiring |
| B5 | Honors | `useHonors.ts`, honor eligibility | 12 | Honor repository | honors, events, assignments | Referee ownership, reviewer/admin authorization | P0-P2 | Submission, verification, duplicate and region tests | Revert adapter wiring |
| B6 | Notifications | Notification context/preferences/hooks | 25 | Notification repository and realtime adapter | notifications, preferences, Realtime | User-only reads; insert policy; channel auth | P2-P3 | User isolation and subscription tests | Disable realtime adapter |
| B7 | Discussion | `useDiscussions.ts` | 19 | Discussion repository | topics, replies, Realtime, missing `increment_view_count` contract | Author/moderator RLS; missing RPC remains blocked | P0-P3 | Topic/reply ownership and view-count contract tests | Do not migrate missing RPC path |
| B8 | Learning | Learning hooks | 10 | Learning repository | learning materials/progress | Admin write and user progress RLS | P2-P3 | Role and progress isolation tests | Revert adapter wiring |
| B9 | Audit / Reports / Settings / Reference Data | Analytics, audit, organization, registration, reports, settings, signed URL, system rules | 24 | Operational repositories and explicit System Rules repository | Baseline RPCs; missing settings view; dynamic tables | Admin/region RLS, signed URL scope, explicit table methods | P0-P3 | Audit integrity, export/import, settings and region tests | Keep direct path disabled until contract review |
| B10 | Remaining managed adapters | Any remaining external function/storage/auth call-sites after grouping | 4 | Service-specific adapters | Auth, Storage, Edge Functions | Provider contract and JWT/RLS boundary | P0-P3 | Contract and failure-mode tests | Remove adapter registration |

Counts are planning aggregates; record-level authority remains the 270-entry Phase 7.3 JSON. Batches B7 and B9 cannot become migration-ready until B-001 through B-005 are resolved.
