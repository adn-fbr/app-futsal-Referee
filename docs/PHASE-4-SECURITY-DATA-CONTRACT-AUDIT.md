# PHASE 4 - `/referees`
# Security + Data Contract Audit

Date: 2026-09-24  
Mode: **READ-ONLY AUDIT**  
Production project: `AFP SULSEL` / `xfscfjwapwnkiinkgbjg`  
Test project: `test APP` / `shorsqyycpptxcutrqrb`

## 1. Executive Summary

Overall Phase 4 status: **BLOCKED - ADDITIONAL EVIDENCE REQUIRED**

The source and checked-in SQL confirm that the Phase 3 UI did not remediate the security/data contract findings. The strongest evidence is static and repository-local:

- `RefereeDetail` requests signed URLs through `useSignedUrl` whenever document paths exist, before any province-admin capability condition is applied to the hook.
- `useReferee` requests `profiles.select("*")`, then separately checks the target's `wasit` role.
- Checked-in Production SQL grants `get_referees` and `count_referees` to both `anon` and `authenticated`, and both functions contain the legacy `auth.role() = 'authenticated' OR p.is_active = true` fallback.
- The current RPC return contract omits `kabupaten_kota_name`, while the hook model/UI expect it. Historical migrations contain a region-aware variant, so contract drift is confirmed in repository artifacts.
- Region scope, direct-object access, Storage policy behavior, and live Production function behavior could not be verified read-only in this environment. Production is not linked, and Supabase CLI 2.67.1 has no `db query` command.
- CSV serialization quotes cells but does not escape embedded quotes, neutralize formula-leading values, or explicitly define newline/delimiter hardening.
- Existing `audit_logs` infrastructure is present, but referee edits, status changes, document access, and export are not wired to a referee-specific event contract.
- No focused `/referees` route/list/detail/security test suite was found.

No migration, DDL, DML, RLS, Storage policy, RPC, Edge Function, auth, or production-data operation was performed.

### Priority summary

- **P0:** SEC-001, SEC-002, SEC-003, DATA-001, REGION-001, IDOR-001 remain open or not verified.
- **P1:** SEC-004, AUDIT-001, and focused security/application coverage require contract decisions.
- **P2:** PERF-001 and PERF-002 require scale thresholds and approved aggregate/query contracts.

## 2. Evidence Inventory

### Source evidence inspected

- [src/pages/Referees.tsx](../src/pages/Referees.tsx)
- [src/pages/RefereeDetail.tsx](../src/pages/RefereeDetail.tsx)
- [src/hooks/useReferees.ts](../src/hooks/useReferees.ts)
- [src/hooks/useSignedUrl.ts](../src/hooks/useSignedUrl.ts)
- [src/lib/authAudit.ts](../src/lib/authAudit.ts)
- [src/App.tsx](../src/App.tsx)
- [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)
- [src/integrations/supabase/types.ts](../src/integrations/supabase/types.ts)
- Existing tests under [src/test](../src/test)

### Static database evidence inspected

- [production-schema.sql](../production-schema.sql)
- [nonprod-public-schema.sql](../nonprod-public-schema.sql)
- Historical migrations under [supabase/migrations](../supabase/migrations)
- Existing security analysis under [docs](.)

### Live project metadata evidence

`supabase projects list --output json` succeeded without mutation:

- Production `xfscfjwapwnkiinkgbjg`: `ACTIVE_HEALTHY`, not linked.
- Test `shorsqyycpptxcutrqrb`: `ACTIVE_HEALTHY`, linked.
- CLI version: `2.67.1`.
- CLI exposes no `supabase db query` command in this version.

### Live verification boundary

No live Production function grants, function bodies, RLS policies, Storage policies, role-scoped reads, or direct-object tests were executed. A schema/data dump or pull would require a database connection/password and would create local artifacts; no such operation was attempted. Therefore repository SQL is classified as **static source evidence**, not proof of current live behavior.

## 3. Source-of-Truth Drift Check

Phase 3 report and current source are materially consistent on the open findings:

- UI improvements are present.
- Query hooks and RPC calls are unchanged.
- `profiles.select("*")` remains.
- `useSignedUrl` remains enabled from `RefereeDetail` without a capability argument.
- CSV serializer remains unchanged.
- No focused referee security tests were added.

Status: **NO MATERIAL REPORT DRIFT**.

## 4. SEC-001 - Sensitive Document Capability

### Finding

`license_photo_url` and `ktp_photo_url` are sensitive document paths. The detail component calls `useSignedUrl(referee?.license_photo_url)` and `useSignedUrl(referee?.ktp_photo_url)` for any loaded referee detail. The visible preview/download controls are conditionally rendered for `isAdminProvinsi()`, but URL generation is not conditionally enabled by that capability.

### Evidence

- `RefereeDetail` invokes both hooks before the render-level role conditions.
- `useSignedUrl` calls `supabase.storage.from(bucket).createSignedUrl(path, 3600)` when `bucketPath` is present.
- Download uses `createSignedDownloadUrl` with a 60-second signed URL.
- `isAdminProvinsi()` gates buttons and click behavior, not hook creation.
- No service-role key is used by this path; the browser Supabase client is used.
- Bucket name defaults to `documents`; object path is extracted from URL or treated as a path.

### Required answers

1. **Who can request a signed URL?** Any viewer who can load a detail row containing a document path, according to client request sequence; backend Storage policy may reject it, but that is not verified.
2. **Authorization before URL generation?** No application capability check before hook execution. Storage authorization may occur inside Supabase, not verified.
3. **UI-only authorization?** Visible controls are UI-gated; backend enforcement is unknown.
4. **Can Kab/Kota receive a URL?** The source permits the request sequence; whether Storage returns a URL is not verified.
5. **Replay after capability changes?** A 3600-second signed URL can remain usable until expiry if issued; revocation behavior is not verified.
6. **Storage policy boundary?** Not verified.
7. **Predictable object path?** The client accepts/stores a path or URL; path structure and enumeration resistance are not verified.
8. **Direct object access?** Not verified.
9. **Service role?** Not used by inspected browser path.
10. **Province-only?** Current UI intent is province-admin-only, but owner decision remains open.

### Status

```text
SEC-001 STATUS: OPEN / PARTIALLY VERIFIED
```

Partially verified means the client-side request sequence and visible intent are verified; backend capability is not.

### Attack surface

- Detail route access followed by signed URL creation.
- Direct replay of a still-valid signed URL.
- Storage object path exposure through profile data.
- Role mismatch between button visibility and URL generation.

### Remediation required

Define separate view/download capability for license and KTP. Verify Storage policies and server-side authorization. A frontend request guard may reduce unnecessary requests only after capability is approved; it cannot be considered a security fix.

### Production change required

**UNKNOWN / LIKELY YES** if Storage or server authorization is deficient. No production change authorized in this phase.

### Test environment required

**YES.** Use isolated role fixtures for province admin, Kab/Kota admin, direct URL replay, and object access.

## 5. SEC-002 - Profile Projection

### Current projection

```text
profiles.select(`
  *,
  kabupaten_kota:kabupaten_kota_id (id, name)
`)
```

The row is then returned with all selected profile fields plus `kabupaten_kota_name` derived from the relation.

### Required UI fields currently used by `/referees/:id`

- `id`
- `full_name`
- `birth_date`
- `kabupaten_kota_id`
- derived `kabupaten_kota_name`
- `license_level`
- `license_expiry`
- `profile_photo_url`
- `is_active`
- `is_profile_complete`
- `afk_origin`
- `created_at`
- `license_photo_url`
- `ktp_photo_url`

The edit mutation uses `full_name`, `license_level`, `kabupaten_kota_id`, and `afk_origin`. The document section uses license/KTP paths.

### Sensitive or unnecessary by default

Because `profiles.*` is schema-coupled, all profile columns not listed above cross the client boundary. Candidate sensitive/unnecessary groups include contact data, identity data, registration metadata, deletion/system metadata, and any future profile columns. Exact column names must be verified from the live schema before a minimal projection is approved.

### Proposed minimal projection

A projection should be approved as a backend/data contract, not silently introduced:

```text
id,
full_name,
birth_date,
kabupaten_kota_id,
license_level,
license_expiry,
profile_photo_url,
is_active,
is_profile_complete,
afk_origin,
created_at,
license_photo_url,
ktp_photo_url,
kabupaten_kota:kabupaten_kota_id (id, name)
```

Whether birth date and document paths belong in the same projection depends on role/capability. A safer design may split operational profile data from capability-gated document metadata.

### Status

```text
SEC-002 STATUS: OPEN / VERIFIED STATICALLY
```

The broad projection is verified in source. The exact unnecessary field set is not live-schema verified.

## 6. SEC-003 - `get_referees` and `count_referees` Authorization

### Source definition

Checked-in [production-schema.sql](../production-schema.sql) defines both functions as `LANGUAGE sql SECURITY DEFINER`, with `search_path` set to `public`.

Both contain:

```sql
auth.role() = 'authenticated'
OR p.is_active = true
```

Neither source definition shown here resolves the caller's application role, `auth.uid()`, or Kab/Kota region ownership. Filters are caller-supplied values.

### Static grant state

Checked-in Production SQL grants both functions to:

- `anon`
- `authenticated`
- `service_role`

This is static artifact evidence only.

### Live grant state

```text
NOT VERIFIED
```

Production is not linked and no read-only SQL metadata query was available through CLI 2.67.1 in this environment.

### Live behavior

```text
NOT VERIFIED
```

No anonymous/authenticated direct RPC invocation or role fixture test was run.

### Expected authorization

At minimum, the expected contract requires:

- authenticated caller verification for administrative list/count access;
- explicit role resolution for `admin_provinsi` and `admin_kab_kota`;
- region restriction for Kab/Kota admins;
- approved field projection;
- direct RPC behavior consistent with route intent;
- no active-referee anonymous fallback unless explicitly approved as a separate public contract.

### Actual authorization conclusion

The source artifact indicates possible unintended disclosure through anonymous execution of active-referee rows if grants are effective. This is a **security concern**, not a proof of live exploitability.

### Status

```text
SEC-003 STATUS: OPEN / NOT VERIFIED LIVE
```

### Production change required

**UNKNOWN**, but likely requires a separately approved RPC/grant/RLS remediation if live verification confirms the static artifact.

### Test environment required

**YES.** Direct RPC tests must cover anon, authenticated non-admin, province admin, Kab/Kota same-region, and Kab/Kota cross-region callers.

## 7. REGION-001 - Region Boundary

### Authoritative region candidates

- User profile: `profiles.kabupaten_kota_id`.
- Referee profile: `profiles.kabupaten_kota_id`.
- Region name relation: `kabupaten_kota.id/name`.
- Role source: `user_roles` with application roles.

### Current source path

- Route guard checks only admin role class.
- List passes an arbitrary `_kabupaten_kota_id` filter from UI.
- Detail fetches a profile by arbitrary `id`, then checks only whether that target has `wasit` role.
- Update and status hooks update arbitrary profile IDs by `.eq("id", id)` and rely on backend policy.

### Expected tests

```text
Kab/Kota A -> list A: allowed only if approved contract
Kab/Kota A -> list B: denied or constrained by server policy
Kab/Kota A -> detail B: denied or null/error by server policy
Kab/Kota A -> edit/status B: denied by server policy
Kab/Kota A -> document B: denied by Storage/server policy
Kab/Kota A -> export: limited to allowed visible rows
```

### Status

```text
REGION-001 STATUS: OPEN / NOT VERIFIED
```

No live test user/fixture or backend policy inspection was available. Frontend filters are not evidence of enforcement.

## 8. IDOR-001 - Direct Referee ID Access

### Attack surface

- `/referees/:id` accepts a route parameter.
- `useReferee` queries `profiles.eq("id", id)`.
- The separate `user_roles` check confirms only the target's `wasit` role.
- Mutation hooks update by target `id` without a client-side region check.

### Status

```text
IDOR-001 STATUS: OPEN / NOT VERIFIED
```

The backend may correctly reject unauthorized rows, but this is not proven. A route guard is not an object-level authorization control.

## 9. DATA-001 - Region Contract Drift

### Current contract

- Current `production-schema.sql` `get_referees` return table contains `kabupaten_kota_id` but not `kabupaten_kota_name`.
- Current generated type in [src/integrations/supabase/types.ts](../src/integrations/supabase/types.ts) also omits `kabupaten_kota_name`.
- `Referee` interface includes `kabupaten_kota_name` and the list renders it.
- `useReferee` separately joins `kabupaten_kota` and derives the name for detail.

### Historical intended contract evidence

Historical migrations contain a `get_referees` variant returning `kabupaten_kota_name` from a `kabupaten_kota` join. Other migrations/current schema use a paginated UUID-returning signature without the name. This is migration/signature drift, not proof that the historical contract is deployable.

### Expected contract

The owner must choose one authoritative strategy:

1. RPC returns `kabupaten_kota_name` through an approved versioned return contract; or
2. UI resolves the name through an approved separate region query using the identifier.

Do not invent a new field or silently change the existing RPC.

### Migration impact

Potentially high: PostgreSQL function return signatures, generated types, consumers such as assignment hooks, and migration history may be affected. A migration or RPC replacement may be required and is outside this audit.

### Rollback strategy

Before any approved change: capture the live function signature/body, dependent call sites, generated types, and migration hash. Roll back by restoring the prior approved function signature/body and regenerated client contract in the test environment first. No Production rollback was performed.

### Status

```text
DATA-001 STATUS: OPEN / VERIFIED STATIC DRIFT
```

## 10. PERF-001 - Expiry Filtering

### Current cost

- When expiry filter is active, `useReferees` calls `get_referees` with `_limit: null`, `_offset: 0`.
- It fetches all rows matching other filters into the browser.
- It filters `license_expiry` in JavaScript and slices the page locally.
- `useRefereesCount` repeats a full unbounded fetch to count matches.
- Two network requests are made for the list/count path, both potentially unbounded.

### Expected scale risk

Rows transferred, browser memory, latency, and count consistency grow linearly with matching referee count. Pagination does not protect the expiry path.

### Remediation options

- Add an approved server-side expiry predicate to the data contract.
- Add a bounded aggregate/count function for expiring licenses.
- Define timezone and inclusive/exclusive date boundary.
- Keep current client behavior until contract and scale threshold are approved.

```text
PERF-001 STATUS: OPEN / VERIFIED STATICALLY
```

## 11. PERF-002 - Statistics

### Current cost

`useRefereeStats` calls `get_referees` without pagination and counts total/active/inactive in the browser. It also computes license counts locally, although the current UI only displays three metrics. This adds an unbounded data request independent of the paginated list and count query.

### Remediation options

- Reuse an approved aggregate RPC with explicit role/region scope.
- Add bounded count queries only after authorization contract approval.
- Remove unused license calculations if they are not part of approved product requirements.
- Add query timing/row thresholds before choosing implementation.

```text
PERF-002 STATUS: OPEN / VERIFIED STATICALLY
```

## 12. SEC-004 - CSV Serialization Security

### Current export fields

```text
Nama Lengkap
Lisensi
Kabupaten/Kota
AFK Origin
Status
Tanggal Bergabung
Tanggal Lahir
Tanggal Expired Lisensi
```

This is page-only and includes birth date, which is sensitive personal data and requires field-scope approval.

### Current serializer behavior

- Wraps every cell in double quotes.
- Does not double embedded double quotes.
- Joins fields with comma.
- Joins rows with `\n`.
- Does not normalize/validate CRLF or embedded newlines.
- Does not neutralize formula-leading values beginning with `=`, `+`, `-`, or `@`.
- Does not add a UTF-8 BOM; compatibility impact is not determined.

### Safe serialization contract before implementation

- Use an approved field allowlist with explicit decision on birth date.
- Escape `"` as `""` inside quoted values.
- Preserve embedded commas/newlines inside quoted cells.
- Normalize line endings to CRLF or an approved standard.
- Neutralize formula-leading values for spreadsheet consumers using an approved prefix strategy.
- Add automated tests for quotes, commas, CRLF, Unicode, and formula prefixes.
- Keep scope `Export halaman ini`.

```text
SEC-004 STATUS: OPEN / VERIFIED STATICALLY
```

No serializer change was made in Phase 4.

## 13. AUDIT-001 - Audit Event Contract

### Existing infrastructure

- `audit_logs` table is used by `logAuthAudit` and `writeAuditLog`.
- `get_audit_logs` and an Audit Logs page exist.
- `writeAuditLog` currently hardcodes `entity_type: "event"`, so it is not a ready referee-specific writer without contract review.
- `logAuthAudit` supports auth events only.

### Required event design candidates

| Event | Actor | Target | Minimum metadata | Server-side required |
|---|---|---|---|---|
| `REFEREE_PROFILE_EDIT` | Authenticated admin | referee profile ID | changed field names, result, region context | Unknown; preferred for tamper resistance |
| `REFEREE_ACTIVATE` | Authenticated admin | referee profile ID | old/new account state, region context, result | Unknown; preferred |
| `REFEREE_DEACTIVATE` | Authenticated admin | referee profile ID | old/new account state, region context, result | Unknown; preferred |
| `REFEREE_DOCUMENT_VIEW` | Authorized actor | referee ID/document type | document type, result, request context | Yes if compliance requires reliable access audit |
| `REFEREE_DOCUMENT_DOWNLOAD` | Authorized actor | referee ID/document type | document type, result | Yes if compliance requires reliable access audit |
| `REFEREE_EXPORT_PAGE` | Authenticated admin | list scope | row count, filter metadata without sensitive values | Unknown |
| `REFEREE_PERMISSION_DENIED` | Attempting actor if known | target/scope | capability, result, reason code | Preferred |

### Status

```text
AUDIT-001 STATUS: OPEN / INFRASTRUCTURE VERIFIED, REQUIREMENTS NOT VERIFIED
```

Do not create a parallel audit system. Reuse the existing platform contract after owner approval; document any need for server-side writers.

## 14. QA-001 - Focused Test Coverage

### Found

- Existing tests cover assignment route capability and assignment/referee-event async states.
- Existing generic authorization tests do not prove `/referees` list/detail/mutation object access.

### Not found for `/referees`

- List loading, empty, filtered-empty, RPC error, retry, pagination, search, and filter behavior tests.
- Page-only export behavior and serializer edge-case tests.
- Detail loading, not-found, RPC error, retry, edit, status confirmation, and mutation failure tests.
- Search label/clear action, filter trigger/sheet focus, `aria-live`, dialog, and action-label tests.
- Province/Kab/Kota cross-region tests, direct ID tests, document capability tests, and direct RPC authorization tests.

```text
QA-001 STATUS: OPEN / VERIFIED STATICALLY
```

## 15. Current vs Target Architecture

```text
CURRENT

Route guard (admin class)
  -> Referees list/detail
  -> browser RPC calls and direct profile queries
  -> client-side filters/stats/export
  -> UI role checks for document buttons
  -> Storage signed URL request from detail hook
  -> backend authorization behavior UNKNOWN

TARGET

Authenticated, role- and region-boundary verified read contract
  -> explicit minimum-necessary list/detail projections
  -> capability-verified document access before signed URL request
  -> server-bounded expiry/count/statistics contracts
  -> explicit page-only safe CSV contract
  -> existing audit infrastructure with approved referee event contract
  -> focused role, region, IDOR, Storage, CSV, and UI tests
```

## 16. Required Remediation Matrix

| ID | Finding | Current Evidence | Risk | Proposed Fix | Layer | Test Required | Production Change |
|---|---|---|---|---|---|---|---|
| SEC-001 | Sensitive documents | Signed URL hooks run for loaded document paths; visible controls are province-admin-only | Sensitive document disclosure or URL replay | Freeze view/download capability; verify Storage/server boundary; then gate request and backend | D | Storage role tests, replay/expiry, direct object tests | Unknown; likely yes if deficient |
| SEC-002 | Broad profile projection | `profiles.select("*")` | Unnecessary/sensitive fields cross client boundary | Approve and implement explicit minimum projection, possibly split document metadata | B/C | Projection contract and field exposure tests | Likely application query only; schema unknown |
| SEC-003 | RPC authorization | Static grants to anon/authenticated and public fallback in SECURITY DEFINER functions | Anonymous or cross-role disclosure | Verify live grants/body; replace with explicit caller/region authorization only after approval | C | anon/authenticated/role/region direct RPC tests | Unknown; likely yes if live state matches |
| SEC-004 | CSV injection | Basic quoting without quote escaping/formula neutralization; birth date exported | Malformed CSV or spreadsheet formula execution | Approve fields and safe serializer contract | A/B | Serializer edge cases and export scope | No database change expected |
| DATA-001 | Region contract | RPC/type omit name; hook/UI expect it; historical migration includes it | Blank region or unsafe workaround/signature drift | Freeze authoritative identifier/name strategy and version contract | B/C | Generated type and consumer contract tests | Potential RPC migration |
| REGION-001 | Region boundary | UI accepts arbitrary region filter; backend scope unverified | Cross-region data/mutation access | Verify and enforce server-side region boundary | C | Same/cross-region list/detail/mutation/export tests | Likely RLS/RPC change if deficient |
| IDOR-001 | Direct ID access | Detail and mutations address arbitrary profile ID | Unauthorized detail/edit/status/document access | Verify object-level authorization and target role/region | C/D | Direct ID tests for every capability | Likely backend change if deficient |
| PERF-001 | Expiry filtering | Unbounded RPC fetch + browser filter + repeated count fetch | Latency, memory, pagination/count cost | Approved server-side predicate/count | B/C | Query boundedness and result semantics | Potential RPC change |
| PERF-002 | Stats | Unbounded `get_referees` fetch and local counting | Unbounded payload and unnecessary work | Approved aggregate contract or bounded counts | B/C | Aggregate correctness/role scope/performance | Potential RPC change |
| AUDIT-001 | Audit events | Existing audit infrastructure; referee paths not wired | Missing accountability or parallel logging risk | Approve event taxonomy and reuse canonical writer/server path | C | Payload, actor, entity, denial, and failure tests | Unknown |
| QA-001 | Focused tests | No dedicated `/referees` coverage | Regression and security assumptions remain untested | Add UI, application, RPC, RLS, Storage, CSV, IDOR tests | E | Full matrix in Test Plan | No production change |

## 17. Migration Impact

| Area | Required now | Impact if remediation approved |
|---|---|---|
| Schema | No | Unknown; explicit projection may not require schema change |
| RPC definitions | No | Potentially high for region field, expiry aggregate, stats, and caller checks |
| Grants | No | Potentially high for anonymous/public fallback removal |
| RLS | No | Potentially high if profile/storage object scope is deficient |
| Storage policy | No | Potentially high for document capability correction |
| Edge Functions | No | Unknown; not required by current source evidence |
| Client types | No | Regenerate only after authoritative RPC contract is approved |
| Production data | No | None authorized |

### Rollback strategy

No remediation may be applied before test-environment proof. Capture the current function signatures/bodies, grants, RLS/Storage policy inventory, generated types, and migration hashes. Apply approved changes only in test first. Roll back by restoring the prior approved contract/policy set and generated types, then rerun direct role/region/IDOR tests. No Production rollback path was executed because no Production mutation occurred.

## 18. Test Plan

### UI tests

- List loading/skeleton, success, empty database, filtered-empty, error/retry.
- Stats loading/error and no false zero.
- Search label, clear, query persistence, result context.
- Filter apply/reset/active count and sheet focus.
- Pagination zero/first/middle/final and `aria-current`.
- Detail loading, not found, error/retry, confirmation, mutation pending/success/error.
- Keyboard navigation, dialog/sheet focus, accessible action labels.

### Application tests

- Route roles for province admin, Kab/Kota admin, panitia, wasit, evaluator.
- Existing search/filter/pagination semantics.
- Page-only export count and approved field allowlist.
- No new document request outside approved capability.

### RPC tests

- Anonymous direct call denied unless an explicitly approved public contract exists.
- Authenticated non-admin denied for administrative list/count.
- Province admin allowed within approved scope.
- Kab/Kota admin constrained to approved region.
- Invalid/foreign region parameters do not widen scope.
- Explicit projection and region name contract matches generated types.

### RLS tests

- Same-region read/update behavior.
- Cross-region read/update denial.
- Direct profile ID denial.
- Update requires appropriate SELECT/UPDATE policy path.

### Storage tests

- License/KTP view/download matrix by role.
- Direct object path denial for unauthorized role/region.
- Signed URL TTL and replay behavior.
- Capability changes and existing URL behavior.

### IDOR tests

- Kab/Kota A cannot detail, edit, activate/deactivate, export, or request documents for Kab/Kota B.
- Non-admin cannot invoke equivalent direct calls.
- Unknown/non-wasit target does not disclose profile fields.

### CSV tests

- Quotes, commas, CRLF/newlines, Unicode.
- `=`, `+`, `-`, `@` formula-leading cells.
- Approved field allowlist and page-only row count.
- No document paths, tokens, or unnecessary sensitive fields.

### Performance tests

- Bounded row/byte count for expiry and stats queries.
- Query time at representative referee volumes.
- Pagination/count consistency at date boundaries.
- Region scope remains enforced under aggregate queries.

## 19. Production Safety Assessment

```text
Production project inventory: READ-ONLY metadata only
Production mutation executed: NO
Production SQL query executed: NO
Production schema/RLS/Storage/RPC change: NO
Test project mutation executed: NO
Secrets printed or modified: NO
```

Because live authorization and Storage behavior remain unverified, this phase cannot certify Production safety or readiness.

## 20. Unresolved Questions

1. What are the approved view/download capabilities for license and KTP per role?
2. What are the effective live Storage policies and object-path protections?
3. What are the effective live grants and function bodies for `get_referees`/`count_referees`?
4. What is the authoritative region-name contract: RPC return or separate approved lookup?
5. Is Kab/Kota region scope enforced for list, detail, mutation, export, and documents?
6. What fields are approved for detail and page-only CSV export, especially birth date?
7. What account/license status and date-boundary semantics are approved?
8. Which referee audit events are mandatory and must be server-side?
9. What scale threshold requires server-side expiry/statistics remediation?
10. Which isolated test fixtures and credentials are authorized for role/region/Storage tests?

## 21. Approval Gate

```text
PHASE 4 STATUS:
BLOCKED — ADDITIONAL EVIDENCE REQUIRED

AUDIT:
STATIC EVIDENCE COMPLETE

LIVE PRODUCTION AUTHORIZATION:
NOT VERIFIED

LIVE PRODUCTION STORAGE:
NOT VERIFIED

MIGRATION:
NOT STARTED

RPC/RLS/STORAGE CHANGES:
NOT STARTED

PRODUCTION DATA:
NOT MODIFIED
```

The next phase may not implement remediation until the open questions above are resolved and the required test-environment authorization is explicit.
