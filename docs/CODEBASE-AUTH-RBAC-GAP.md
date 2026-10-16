# Auth and RBAC Gap Analysis

## Current model

`AuthContext` resolves session, profile, and roles through Auth/Profile/Role repositories. `ProtectedRoute` handles loading, unauthenticated, profile missing, role missing, forbidden, and authorization-error states. Roles observed: `admin_provinsi`, `admin_kab_kota`, `evaluator`, `panitia`, `wasit`.

Edge Functions use shared bearer-token plus profile/role resolution. The browser does not use service-role credentials. RLS remains the database boundary.

## Findings

| ID | Severity | Evidence | Impact | Classification |
|---|---|---|---|---|
| AR-001 | P1 | 8.3E RLS/mutation tests not executed; assignment hook performs duplicate client and direct `user_roles` checks | Admin assignment authorization is not integration-proven | BLOCKED |
| AR-002 | P1 | Most business hooks bypass repositories; role checks distributed across pages/hooks | authorization policy drift is hard to audit | OPEN ARCHITECTURE |
| AR-003 | P2 | Role visibility and route guard previously diverged; fixed statically in 8.3D | regression risk without capability matrix tests | RESOLVED STATICALLY |
| AR-004 | P2 | `user_roles`/profile resolution required by every protected route | missing profile/role correctly blocks UI, but runtime integration is unverified | OPEN VALIDATION |
| AR-005 | P2 | Membership repository/schema is missing | organization/tenant scope cannot be represented through a dedicated boundary | SCHEMA/ARCHITECTURE GAP |

## Role/action summary

- `admin_provinsi`: approvals, users, settings, export/import, admin assignment management.
- `admin_kab_kota`: regional/admin workflows but not provincial-only approvals/settings.
- `panitia`: event workflows; assignment CTA mismatch was fixed statically.
- `evaluator`: evaluation workflows.
- `wasit`: referee event, honor, learning, discussion, profile, ID card.

## Security disposition

No new exploit is claimed. No email, display name, user metadata, localStorage role, or password is used as the canonical role source in inspected authorization paths. The remaining high-value task is Non-Production identity/RLS proof, followed by centralizing capability policy without weakening database enforcement.
