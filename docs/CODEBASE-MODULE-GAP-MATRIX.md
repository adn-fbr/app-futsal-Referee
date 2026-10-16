# Module Gap Matrix

Status terms reflect current evidence, not visual completeness. Historical/resolved items are marked explicitly.

| ID | Severity | Category | Module | Evidence | Current behavior | Expected | Gap | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|---|
| G-001 | P1 | API_CONTRACT | Events | `useEvents.ts:556`; canonical RPC audit | five-argument duplicate check/array expectation | three text args/boolean canonical contract | runtime duplicate protection can fail | reconcile caller only | OPEN |
| G-002 | P1 | DATABASE | Discussions | `useDiscussions.ts:118` | calls absent canonical `increment_view_count` | governed canonical object | discussion view action contract gap | obtain contract decision | OPEN |
| G-003 | P1 | DATABASE | Settings | `useSettings.ts:31,46` | references historical `public_system_settings` | canonical settings contract | settings runtime may fail | reconcile object ownership | OPEN |
| G-004 | P1 | RLS | Event Assignments | 8.3E RLS tests not executed | static route/UI checks only | identity-specific RLS proof | authorized Non-Production fixture test | BLOCKED |
| G-005 | P1 | FUNCTIONAL | Event Assignments | 8.3D/8.3E evidence | mutation statically constrained but not live-tested | persisted pending->confirmed with audit/notifications | core workflow unverified | run browser + RLS + mutation validation | BLOCKED |
| G-006 | P1 | SECURITY | Seed capability | `useSeedDatabase.ts`, Edge Function remains | UI exposure resolved, privileged function remains | capability isolated from production | residual backend capability risk | environment-gate/remove function in governed phase | OPEN |
| G-007 | P1 | ARCHITECTURE | Domain access | 233 direct `.from`, 33 direct-access files | contracts/auth logic distributed | auditable repository/service boundaries | inconsistent behavior and maintenance risk | incremental repository extraction | OPEN |
| G-008 | P1 | TESTING | Core workflows | 9 files/26 tests; no browser/RLS | local tests only | integration proof for auth/RBAC/RLS/mutations | production readiness cannot be certified | build focused integration harness | OPEN |
| G-009 | P2 | DOCUMENTATION | Governance | route/page counts stale | inventories disagree | generated current inventories | audit blind spots | regenerate artifacts | OPEN |
| G-010 | P2 | UI_UX | Cross-module async | pages handle loading inconsistently | error/retry incomplete outside remediated areas | shared states | misleading empty/error states | standardize after core validation | OPEN |
| G-011 | P2 | ACCESSIBILITY | Tables/dialogs/forms | static 8.3B findings; runtime absent | semantics/focus unverified | WCAG-oriented checks | accessibility readiness unknown | keyboard/axe/browser pass | OPEN |
| G-012 | P2 | DATA | Organization | static header/demo data noted in capability matrix | some presentation data not canonical | persisted canonical organization data | data drift | reconcile model before expansion | OPEN |
| G-013 | P2 | PERFORMANCE | Bundle/data | build warns >500KB chunk; direct full lists visible | large bundle and possible unbounded reads | bounded/cached workflows | scale risk | measure before optimizing | OPEN |
| G-014 | P3 | FUNCTIONAL | Orphan pages | Bookings/Courts/Teams not in App routes | files exist but unreachable | route or remove by product decision | dead code/product ambiguity | decide scope | OPEN |
| G-015 | P3 | DESIGN | Shared UI | repeated page patterns/raw tables | variants drift | shared primitives | consistency debt | defer until core readiness | OPEN |

Historical/resolved: F-007 page/bundle exposure, F-001–F-003 navigation/CTA mismatches, F-004/F-008 static error states, F-005/F-006 static assignment controls, and F-011 typecheck script were addressed in prior phases but live validation remains incomplete where noted.
