# PHASE-7.3A Migration Readiness

Version: v1.0.0
Status: BLOCKED

## Readiness classification

| Candidate set | Operations | Classification | Reason |
| --- | ---: | --- | --- |
| Verified public tables, views, and resolved RPCs | 220 | READY_WITH_SECURITY_REVIEW | Canonical identity exists; browser writes still require repository and RLS review |
| External Auth, Storage, Realtime, and Edge Function calls | 45 | BLOCKED_EXTERNAL_CONTRACT | Managed contract must be wrapped without treating it as application schema |
| `increment_view_count` | 1 | BLOCKED_SCHEMA_GAP | Historical migration reference is absent from immutable baseline |
| `public_system_settings` reads | 2 | BLOCKED_SCHEMA_GAP | Historical view reference is absent from immutable baseline |
| Dynamic `systemRules.ts` updates | 2 | BLOCKED_AMBIGUOUS_REFERENCE | Four possible tables; one identity is not determinable per operation |
| Unknown | 0 | BLOCKED_UNKNOWN | No additional unknown contract records |

The labels are operation-level. The overall phase remains blocked because the gate requires all five blockers resolved, not merely all verified operations available for planning.

## Write security requirements

All `INSERT`, `UPDATE`, `DELETE`, `UPSERT`, and RPC records must move behind domain repositories or application services. Authentication must use the existing session/Auth boundary. Authorization must remain enforced by database RLS, function grants, and server-side Edge Function authorization where applicable. User, role, and regional scope must be passed as authorized context, never trusted from arbitrary client input. No browser operation may receive a service-role credential.

The 25 RPC records require exact identity and return-contract tests. Security-definer functions require search-path, grant, and role review. The two dynamic updates require explicit methods for each allowed table before migration; a client-side allowlist alone is not a replacement for RLS.

## Domain repository groups

| Group | Source files / domains | Destination | Readiness |
| --- | --- | --- | --- |
| Authentication, Profile, Role | Auth/Profile hooks, pages, import component | Extend Auth/Profile/Role repositories | READY_WITH_SECURITY_REVIEW |
| Events, Assignments, Approvals | Event and assignment hooks, EventSubmission | Events and Assignments repositories | READY_WITH_SECURITY_REVIEW |
| Referees, Cards, Reviews | Referee hooks and public reviews | Referee and Referee Card/Review repositories | READY_WITH_SECURITY_REVIEW |
| Evaluations | `useEvaluations.ts` | Evaluation repository | READY_WITH_SECURITY_REVIEW |
| Honors | `useHonors.ts`, eligible honor access | Honor repository | READY_WITH_SECURITY_REVIEW |
| Notifications | Notification context/hooks | Notification repository plus realtime adapter | BLOCKED_EXTERNAL_CONTRACT for realtime |
| Discussion | `useDiscussions.ts` | Discussion repository | BLOCKED_SCHEMA_GAP for missing RPC |
| Learning | Learning hooks | Learning repository | READY_WITH_SECURITY_REVIEW |
| Audit, Reports, Settings, Reference Data | Audit/report/settings/organization utilities | Grouped operational repositories | BLOCKED_SCHEMA_GAP or BLOCKED_AMBIGUOUS_REFERENCE where recorded |

No repositories were created in this phase.
