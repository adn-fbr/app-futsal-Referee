# `/referees` Audit Report

Status: **AUDIT COMPLETE - IMPLEMENTATION BLOCKED UNTIL APPROVAL**  
Scope: `/referees` and `/referees/:id`  
Date: 2026-09-24

## 1. Executive Summary

The current referee area is a functional admin list/detail workflow, not yet a mature referee-management platform. The primary experience is a responsive card grid with search, filters, CSV export, pagination, and a dedicated detail route. The most important risks are contract and authorization-boundary issues, not visual polish:

- The `get_referees` RPC does not return `kabupaten_kota_name`, although the TypeScript model and UI expect it.
- The list and statistics perform client-side or full-dataset work for expiry filtering and counts.
- The detail page requests `profiles.select("*")` and generates signed URLs for private license/KTP files before checking whether the viewer is a province administrator.
- The route is restricted to `admin_provinsi` and `admin_kab_kota`, but mutation hooks rely on backend policy enforcement rather than an application-level capability contract.
- Error states, retry behavior, focused tests, labels, and keyboard semantics are incomplete.
- The add button routes to `/users`, which is ambiguous and does not establish a clear referee-creation workflow.

No database schema, RLS policy, authorization model, RPC, Edge Function, or source code was changed during this audit.

## 2. Current Architecture

### Route and page ownership

- Route: `/referees` in [src/App.tsx](../src/App.tsx)
- Main page: [src/pages/Referees.tsx](../src/pages/Referees.tsx)
- Detail route: `/referees/:id` in [src/App.tsx](../src/App.tsx)
- Detail page: [src/pages/RefereeDetail.tsx](../src/pages/RefereeDetail.tsx)
- Layout: [src/components/layout/AppLayout.tsx](../src/components/layout/AppLayout.tsx)

### Supporting data and UI

- Query and mutation hooks: [src/hooks/useReferees.ts](../src/hooks/useReferees.ts)
- Organization filter source: `useKabupatenKotaList` in [src/hooks/useOrganization.ts](../src/hooks/useOrganization.ts)
- Signed document URLs: [src/hooks/useSignedUrl.ts](../src/hooks/useSignedUrl.ts)
- Auth and role resolver: [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)
- Route protection: [src/components/auth/ProtectedRoute.tsx](../src/components/auth/ProtectedRoute.tsx)
- Existing primitives: shadcn/Radix `Card`, `Badge`, `Sheet`, `Dialog`, `Select`, `Pagination`, `Input`, `Button`, Lucide icons, and `StatusBadge`.

### Data flow

```text
Authenticated user
  -> ProtectedRoute(requireAdmin, requireProfileComplete)
  -> Referees page
  -> useReferees / useRefereesCount / useRefereeStats
  -> Supabase RPC get_referees / count_referees
  -> profiles + user_roles + filters

Authenticated user
  -> RefereeDetail
  -> useReferee / useSignedUrl
  -> profiles.select(*) + user_roles lookup + Storage signed URLs
  -> update/toggle hooks -> profiles.update(...)
```

### Read operations

- `useReferees` calls `get_referees` with license, active status, region, search, limit, and offset.
- `useRefereesCount` calls `count_referees` except when expiry filtering is active.
- Expiry filtering fetches all rows, filters dates in the browser, then paginates locally.
- `useRefereeStats` fetches the full referee set and counts total/active/inactive locally.
- The list supports search, Kab/Kota, license, active status, expiry-within-30-days, and pagination.
- Search fields supplied to the RPC are `full_name`, `license_level`, and `afk_origin`.
- `useReferee` selects all profile columns and separately checks for the `wasit` role.

### Write operations

| Action | UI owner | Backend mechanism | Confirmation | Feedback | Auditability status |
|---|---|---|---|---|---|
| Edit profile fields | `RefereeDetail` | `profiles.update(...).eq(id)` | None | Success/error toast | No explicit audit event found in this path |
| Activate/deactivate | `RefereeDetail` | `profiles.update({ is_active })` | None | Success/error toast | No explicit audit event found in this path |
| Preview license/KTP | `RefereeDetail` | Storage signed URL | Not applicable | Loading only | Access intent is not visibly audited |
| Download license/KTP | `RefereeDetail` | Short-lived signed URL | None | Success/error toast | Access intent is not visibly audited |
| Export current page | `Referees` | Browser CSV generation | None | Success/error toast | Export event not visibly audited |
| Add referee | FAB navigates to `/users` | No referee-specific mutation from this page | N/A | N/A | Workflow is ambiguous |

Business rules, RLS, RPC contracts, and Edge Function contracts were not changed.

## 3. Current UX Assessment

### Facts

- The page title supplied to `AppLayout` is `Database Wasit`; there is no dedicated page header, descriptive context, or primary action label.
- The page provides three summary cards: total, active, and inactive.
- Search and filter controls are above a responsive card grid.
- Active filters are represented as removable chips.
- Pagination uses a page size of 50.
- Cards link to a dedicated detail route.
- CSV export exports only the currently loaded page.

### Observations

- The user cannot immediately distinguish the scope of the data, the meaning of current filters, or whether export covers the current page or all matching rows.
- The floating plus button is visually prominent but navigates to `/users`, which is not self-evidently “Tambah Wasit”.
- Expiring licenses are represented as a filter but not as a summary or attention state.
- The range text can produce `Menampilkan 1-0 dari 0 wasit` for an empty result.
- The page uses a card grid rather than a comparison-friendly table; this is workable on mobile but less efficient for administrative scanning on desktop.
- No visible clear-search action exists when only the search query is active.

## 4. Current UI Assessment

### Facts

- Existing project tokens and shadcn/Radix components are reused.
- License badges use `getLicenseBadgeColor`; status uses `StatusBadge`.
- The card displays name, license, region when available, AFK origin, and active/inactive state.
- The detail page groups profile information, admin actions, tabs, and documents.

### Gaps

- Region may be blank in list results because the RPC contract does not return `kabupaten_kota_name`.
- The list has no visible loading treatment for stats, counts, or region options; a missing value becomes zero or blank.
- The detail page has a loading branch and not-found branch but no explicit query-error/retry branch.
- Destructive status changes have no confirmation dialog or consequence explanation.
- There is no consistent status vocabulary beyond active/non-active; license expiry is shown separately and not normalized as a status system.
- Edit fields have no visible validation, required-state model, or field-level error presentation.
- The current add action and detail edit action are not presented as a coherent task flow.

## 5. Accessibility Assessment

### Facts

- Search has a placeholder but no visible label or explicit `aria-label`.
- Export and filter controls are icon-only; they rely on `title` or no accessible name.
- The floating plus button has no accessible name.
- Avatar images in the list and detail do not provide meaningful `alt` text.
- Pagination is primarily click-handler driven and requires verification of keyboard activation, `aria-current`, and disabled semantics.
- Status is not communicated through color alone because text is present, but the semantic status system is inconsistent.

### Recommendations

- Add visible or visually-hidden labels for search and every filter.
- Give every icon-only button an accessible name and use `aria-pressed`/`aria-expanded` where applicable.
- Add meaningful avatar alternative text or mark decorative images appropriately.
- Confirm focus order and focus return for the filter sheet and dialogs.
- Add explicit live-region behavior for loading, result-count changes, save feedback, and errors.
- Preserve WCAG 2.2 AA contrast and minimum touch target sizes.

## 6. Responsive Assessment

### Current behavior

- Cards use one column on small screens, two on medium screens, and three on large screens.
- Filters open in a bottom sheet capped at 80vh.
- A fixed FAB is positioned above the mobile navigation area.

### Gaps requiring browser QA

- No verified narrow-mobile, tablet, or keyboard browser pass was found for this route.
- The fixed FAB and mobile navigation compete for bottom-screen space.
- Filter controls, active chips, pagination, and long names/license labels need overflow testing.
- Desktop users have no dense comparison mode; mobile users have no explicit compact action menu.

## 7. Security-Sensitive UI Findings

### SEC-001 - Sensitive document URL generation is broader than visible controls

- Classification: **High**, pending confirmation of storage policy and intended capability.
- Fact: `RefereeDetail` calls `useSignedUrl` for license and KTP paths for every loaded viewer.
- Fact: Preview/download buttons are shown only when `isAdminProvinsi()` is true.
- Observation: An `admin_kab_kota` viewer can still receive signed URL query results and the image is rendered when available.
- Risk: Sensitive identity documents may be exposed beyond the intended province-admin capability.
- Required action: Documented review first; then align server/storage authorization and UI URL generation with the approved capability. Do not solve this by UI hiding alone.

### SEC-002 - Broad profile selection

- Classification: **High**.
- Fact: `useReferee` uses `profiles.select("*")`.
- Risk: The UI receives fields that are not required for the detail experience, increasing exposure and coupling.
- Required action: Define an explicit safe detail projection after data-owner approval. Do not alter the schema during UI implementation.

### SEC-003 - RPC public fallback requires contract review

- Classification: **High**.
- Fact: `get_referees` is `SECURITY DEFINER` and its SQL condition allows `auth.role() = 'authenticated' OR p.is_active = true`.
- Observation: If the function is executable by `anon`, active referees can be returned outside the route guard.
- Risk: Route protection does not protect direct RPC callers.
- Required action: Verify live grants and RLS/function policy. Existing migration/audit documentation already identifies this pattern as unresolved. No production change is authorized by this report.

### SEC-004 - CSV export escaping

- Classification: **Medium**.
- Fact: CSV cells are quoted but embedded quotes are not doubled, and formula-like values are not neutralized.
- Risk: Malformed CSV and spreadsheet formula injection when exported content is opened in spreadsheet software.
- Required action: Define an approved safe serializer and export scope before implementation.

## 8. Role & Permission Findings

### Route-level matrix

| Capability | `admin_provinsi` | `admin_kab_kota` | `panitia` | `wasit` | `evaluator` |
|---|---:|---:|---:|---:|---:|
| Open `/referees` route | Yes | Yes | No | No | No |
| View list | Yes | Yes | No | No | No |
| View detail | Yes | Yes | No | No | No |
| Edit profile | UI Yes | UI Yes | No | No | No |
| Activate/deactivate | UI Yes | UI Yes | No | No | No |
| View/download documents | Intended UI: Yes | Intended UI: No | No | No | No |
| Export current page | Yes | Yes | No | No | No |
| Create referee from this page | Ambiguous `/users` route | Ambiguous `/users` route | No | No | No |
| Renew/revoke | Not present in this page | Not present in this page | No | No | No |

This matrix describes observed route/UI behavior, not proof of backend authorization.

### Authorization findings

- `ProtectedRoute requireAdmin` limits the route to province and Kab/Kota admins.
- Mutations update `profiles` directly from hooks and do not perform a local role check; backend RLS/policies must be the authoritative boundary.
- Region ownership for `admin_kab_kota` is not proven by the page. It must be verified in RLS, RPC, and storage policies.
- No IDOR conclusion can be made from the UI alone; direct detail access and direct mutation requests require backend verification.

## 9. Data Exposure Findings

| Field/group | Current use | Classification | Finding |
|---|---|---|---|
| Name, license level, active state | List/detail | Operational | Necessary, subject to role scope |
| Region and AFK origin | List/detail/export | Operational | Region may be missing due RPC contract |
| Birth date | Detail/export | Sensitive personal data | Consider minimum-necessary display/export |
| License photo | Detail signed URL | Sensitive document | Capability mismatch requires review |
| KTP photo | Detail signed URL | Sensitive identity document | Capability mismatch requires review |
| All profile columns | Detail query | Internal/sensitive unknown | `select("*")` overexposes by default |
| Internal UUID | Route/query key | Internal | Not visibly presented; backend must enforce object access |
| Created timestamp | Detail/export | Operational metadata | Confirm export necessity |

## 10. Gap Matrix

| ID | Area | Current state | Gap / risk | Severity | Recommendation | Files |
|---|---|---|---|---|---|---|
| DATA-001 | Data contract | UI expects `kabupaten_kota_name` | `get_referees` does not return it; region is usually blank | High | Reconcile RPC/type/UI contract after approval | [useReferees.ts](../src/hooks/useReferees.ts), [production-schema.sql](../production-schema.sql) |
| SEC-001 | Document access | URLs generated for all loaded viewers | Kab/Kota admins may receive sensitive document URLs | High | Verify backend capability, then gate URL generation | [RefereeDetail.tsx](../src/pages/RefereeDetail.tsx), [useSignedUrl.ts](../src/hooks/useSignedUrl.ts) |
| SEC-002 | Data minimization | `profiles.select("*")` | Unneeded profile fields cross the client boundary | High | Replace with approved explicit projection | [useReferees.ts](../src/hooks/useReferees.ts) |
| SEC-003 | RPC authorization | SECURITY DEFINER public fallback present | Active records may be callable by anonymous clients if granted | High | Verify grants/RLS and document decision | [production-schema.sql](../production-schema.sql) |
| UX-001 | Add workflow | FAB routes to `/users` | User intent “add referee” is unclear | High | Define or relabel the workflow | [Referees.tsx](../src/pages/Referees.tsx) |
| UX-002 | Error handling | Loading and empty states only | Query failure is indistinguishable from no data | High | Add retryable error states for list/count/stats/detail | [Referees.tsx](../src/pages/Referees.tsx), [RefereeDetail.tsx](../src/pages/RefereeDetail.tsx) |
| UX-003 | Results count | Always starts at 1 | Empty result can show `1-0 dari 0` | Medium | Use an explicit zero-result range | [Referees.tsx](../src/pages/Referees.tsx) |
| UX-004 | Admin actions | Status toggle has no confirmation | Destructive state change lacks consequence acknowledgment | Medium | Add confirmation dialog and pending/failure states | [RefereeDetail.tsx](../src/pages/RefereeDetail.tsx) |
| UX-005 | Export scope | Exports loaded page | User may assume all filtered data is exported | Medium | State scope visibly and choose approved export contract | [Referees.tsx](../src/pages/Referees.tsx), [useReferees.ts](../src/hooks/useReferees.ts) |
| PERF-001 | Expiry filter | Fetch-all + browser filtering | Cost and pagination correctness degrade with scale | Medium | Add server-side filter/aggregate after backend approval | [useReferees.ts](../src/hooks/useReferees.ts) |
| PERF-002 | Stats | Fetch-all + local counting | Unnecessary payload and work | Medium | Add aggregate query/RPC or bounded stats contract | [useReferees.ts](../src/hooks/useReferees.ts) |
| A11Y-001 | Form labeling | Placeholder-only search | Screen readers lack a clear field name | High | Add label and accessible description | [Referees.tsx](../src/pages/Referees.tsx) |
| A11Y-002 | Icon controls | Filter/export/FAB not consistently named | Keyboard and assistive-tech users lack context | High | Add accessible names and state attributes | [Referees.tsx](../src/pages/Referees.tsx) |
| A11Y-003 | Images | Avatar alt omitted | Identity image semantics are incomplete | Medium | Add meaningful alt or decorative semantics | [Referees.tsx](../src/pages/Referees.tsx), [RefereeDetail.tsx](../src/pages/RefereeDetail.tsx) |
| A11Y-004 | Pagination | Click handlers need semantic verification | Keyboard/current-page behavior may be incomplete | Medium | Test and normalize pagination semantics | [Referees.tsx](../src/pages/Referees.tsx) |
| DATA-002 | Status model | Active/non-active plus expiry warning | No unified referee/license status vocabulary | Medium | Define statuses from actual business semantics first | [Referees.tsx](../src/pages/Referees.tsx), [RefereeDetail.tsx](../src/pages/RefereeDetail.tsx) |
| DATA-003 | Validation | Plain local state inputs | No field-level validation or explicit required rules | Medium | Establish approved validation contract | [RefereeDetail.tsx](../src/pages/RefereeDetail.tsx) |
| SEC-004 | Export security | Basic quoting only | Malformed cells/formula injection risk | Medium | Use safe CSV serialization and approved field list | [useReferees.ts](../src/hooks/useReferees.ts) |
| QA-001 | Coverage | No focused `/referees` suite found | Route/filter/export/a11y regressions can slip through | Medium | Add focused tests without weakening existing tests | `src/test/` |
| RESP-001 | Mobile | Responsive classes exist | No evidence of browser QA at narrow widths | Medium | Run mobile/tablet visual and keyboard QA | [Referees.tsx](../src/pages/Referees.tsx) |
| AUDIT-001 | Auditability | Toasts only | Mutations/export/document access have no visible audit context | Low/High depending on policy | Confirm audit requirements before adding events | Hooks and detail page |

## 11. Proposed Information Architecture

### Current IA

```text
AppLayout: Database Wasit
  -> Summary cards
  -> Search + export + filter sheet
  -> Active filter chips
  -> Result range
  -> Responsive referee card grid
  -> Pagination
  -> Floating plus -> /users

Referee card
  -> /referees/:id
      -> Back
      -> Identity/status
      -> Info card
      -> Admin actions
      -> Informasi tab
      -> Dokumen tab
      -> Edit dialog
      -> Document preview dialog
```

### Proposed IA, pending design approval

```text
AppLayout: Wasit
  -> Page header: scope, count context, approved primary action
  -> Operational summary: total, active, expiring, inactive/error-aware loading
  -> Search + explicit filter controls + clear all
  -> Active filter summary
  -> Desktop comparison table / mobile referee list
  -> Explicit loading, error/retry, empty, filtered-empty states
  -> Pagination and export scope disclosure

Referee detail
  -> Breadcrumb/back
  -> Identity and status summary
  -> Operational/certification information
  -> Approved admin actions in overflow/action area
  -> Sensitive documents section gated by approved capability
  -> Dedicated validation and confirmation patterns
```

The proposed structure improves scanning and state clarity without changing business rules. It must not be implemented until the data projection, document capability, and add workflow are approved.

## 12. Proposed UI/UX Design

- Visual direction: institutional sports-tech; restrained color semantics, clear hierarchy, existing AFP Sulsel tokens, no new global theme.
- Page title: `Wasit` or an approved Indonesian product term; retain consistent terminology across navigation, page, and detail.
- Header: title, short scope description, count context, and a clearly named primary action only if a valid creation flow exists.
- Summary: total, active, expiring soon, and inactive only if the backend contract can provide accurate values.
- Search: labeled field; search only approved identifiers (`name`, license, AFK origin unless a sensitive field is approved).
- Filters: status, Kab/Kota, license, validity; all supported by actual data and resettable.
- Desktop: table for scanning, with identity, region, license, status/validity, and a compact action menu.
- Mobile: cards/list with identity, status, license, region, and an accessible action affordance.
- Detail: dedicated route remains appropriate; avoid moving substantial information into a modal.
- Destructive actions: confirmation dialog, consequence text, pending state, and post-action feedback.
- States: skeleton/loading, retryable error, no-data, filtered-empty, and no-permission states must be distinct.
- Status: only use statuses present in the approved business contract; each has text and semantic color/icon.

## 13. Component Architecture

Reuse existing design-system components. Proposed components should be created only if they reduce repeated behavior:

- `RefereesPageHeader`
- `RefereeStats`
- `RefereeSearchAndFilters`
- `ActiveFilterSummary`
- `RefereeTable` and/or `RefereeCard`
- `RefereeStatus`
- `RefereeActionMenu`
- `RefereeEmptyState`
- `RefereeErrorState`
- `RefereeDetailHeader`
- `SensitiveDocumentSection`
- `ConfirmStatusChangeDialog`

Do not create a parallel design system or modify global tokens before an inconsistency inventory and approval.

## 14. Mobile Design

- First viewport: page title, result count, search, filter trigger, and first referee identity/status.
- Secondary: export and nonessential metadata move into an action menu or filter sheet.
- Search: full-width labeled input with clear action and preserved query state.
- Filters: bottom sheet with active count, reset, apply, and focus return.
- Actions: accessible overflow menu per referee; no destructive action as a dominant FAB.
- Status: text label plus semantic icon/color, visible in every card.
- Detail: open dedicated route; keep back navigation persistent and ensure dialogs fit the viewport.
- Verify at narrow widths for long names, chips, pagination, touch targets, and bottom navigation overlap.

## 15. Accessibility Plan

1. Add labels/names to search, filter, export, FAB/action controls, and form fields.
2. Normalize keyboard focus, dialog focus trap, focus return, and sheet behavior.
3. Use semantic headings, lists/table semantics, `aria-current`, disabled state, and live regions.
4. Add alt/decorative image semantics and non-color status communication.
5. Verify contrast, 44px-class touch targets where applicable, reduced motion, zoom, and reflow.
6. Run keyboard-only and screen-reader smoke checks at desktop and mobile breakpoints.

## 16. Implementation Plan

### Phase A - Foundation

- Confirm terminology, capability matrix, explicit data projections, and approved status vocabulary.
- Inventory existing tokens and component patterns.
- No schema/RLS/business-rule changes in UI phase.

### Phase B - Information Architecture

- Add page header and state-aware summary.
- Normalize search/filter grouping and export scope disclosure.
- Select table/list structure based on approved fields.

### Phase C - Referee Experience

- Improve identity/status presentation.
- Preserve dedicated detail route.
- Add approved action menu, confirmations, validation, and feedback.
- Gate sensitive documents by the approved backend capability.

### Phase D - Responsive

- Desktop comparison table.
- Tablet density adjustments.
- Mobile list/card and bottom-sheet filters.

### Phase E - Accessibility

- Labels, semantics, keyboard navigation, focus behavior, live announcements, contrast, reduced motion.

### Phase F - QA

- Functional regression, role and region regression, sensitive-field review, visual responsive QA, focused automated tests, build/typecheck/lint/test.

## 17. Regression Risk

- **Critical/high:** changing RPC projections, storage access, RLS, or mutation contracts without an approved backend contract.
- **High:** accidentally allowing Kab/Kota administrators to view another region or sensitive documents.
- **Medium:** changing filter semantics, expiry date boundaries, export scope, or license enum casing.
- **Medium:** replacing cards with a table without preserving mobile navigation and detail access.
- **Low:** terminology, spacing, component extraction, and visual hierarchy changes when behavior is preserved.

## 18. Test Plan

Required after approval and implementation:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Focused route/list/detail tests for loading, error, empty, filtered-empty, pagination, search, filters, export, and action states.
- Role matrix tests for province admin, Kab/Kota admin, panitia, wasit, and evaluator.
- Region-boundary and direct-object-access tests at the backend boundary.
- Sensitive document URL/rendering tests.
- Keyboard and accessibility checks for search, filters, dialogs, pagination, and action menus.
- Desktop, tablet, and mobile browser QA.
- Browser-bundle scan to confirm no service-role credential and no newly exposed sensitive fields.

Existing tests must remain valid; tests must not be weakened to make the change pass.

## 19. Files That Will Change After Approval

Expected UI scope, subject to contract review:

- [src/pages/Referees.tsx](../src/pages/Referees.tsx)
- [src/pages/RefereeDetail.tsx](../src/pages/RefereeDetail.tsx)
- [src/hooks/useReferees.ts](../src/hooks/useReferees.ts)
- Possibly new focused components under `src/components/referees/`.
- Possibly focused tests under `src/test/`.

Backend/schema/RLS files must be listed separately and approved if a confirmed security defect requires backend remediation.

## 20. Files That Must NOT Change Without Explicit Approval

- Database schema and destructive migrations.
- RLS policies, grants, role definitions, and authorization model.
- Edge Function and RPC contracts.
- Authentication/session behavior.
- Referee status semantics and business relationships.
- Production data.
- Existing tests solely to suppress failures.

## 21. Approval Gate

**AUDIT COMPLETE**

```text
AUDIT COMPLETE
    -> GAP REVIEW
    -> DESIGN APPROVAL
    -> IMPLEMENTATION
    -> TEST
    -> FINAL QA
```

Implementation was intentionally not started. The next decision required is approval of the gap priorities and the following contract questions:

1. Should `admin_kab_kota` be allowed to access license/KTP documents, or is access province-admin-only?
2. Is `/users` the approved referee-creation workflow, or should the add action be removed/renamed?
3. Should export include the current page only or all rows matching the filters?
4. What is the authoritative license/status enum and expiry semantics?
5. Are audit events required for profile changes, status changes, document access, and exports?
6. Are the existing `get_referees` grants/RLS policies approved, or should the public fallback be remediated in a separately authorized backend task?

No source implementation should proceed until these questions and the severity matrix are reviewed.
