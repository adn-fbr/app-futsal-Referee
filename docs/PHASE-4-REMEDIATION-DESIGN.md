# PHASE 4 - `/referees`
# Evidence-Backed Remediation Design

Status: **DESIGN ONLY - NOT AUTHORIZED FOR IMPLEMENTATION**  
Companion audit: [PHASE-4-SECURITY-DATA-CONTRACT-AUDIT.md](PHASE-4-SECURITY-DATA-CONTRACT-AUDIT.md)

## 1. Design Principles

- Production remains read-only until explicit approval.
- Test project is the only candidate implementation target.
- No frontend visibility change is treated as authorization remediation.
- No new role, status, field, workflow, export scope, or audit system is invented.
- Every contract change must be versioned, tested, and regenerated consistently.
- Minimum necessary disclosure is the default.
- Backend authorization must be proven independently from UI behavior.

## 2. Remediation Order

```text
1. Authorize fixtures and live metadata evidence
2. Freeze document capability and region/caller contract
3. Freeze field projections and export allowlist
4. Implement/test backend contract in test project only
5. Regenerate client types and update application consumers
6. Run role/region/IDOR/Storage/CSV/performance tests
7. Review evidence and explicitly authorize any Production change
```

No step below is an implementation instruction until the approval gate is cleared.

## 3. SEC-001 Sensitive Documents

### Target design

Separate capabilities:

```text
referee.document.license.view
referee.document.license.download
referee.document.ktp.view
referee.document.ktp.download
```

The owner must map these capabilities to roles and, where applicable, region. The conservative current UI intent is province-admin-only, but this is not a backend decision.

### Required contract

- Server/Storage authorization checks the authenticated caller and target referee before issuing a signed URL.
- License and KTP can have different policies.
- View and download can have different policies.
- Object paths are never treated as authorization.
- Signed URL lifetime and replay behavior are documented.
- Unauthorized direct object access is denied.
- Client requests a signed URL only after approved capability state is known, as request minimization; backend remains authoritative.

### Evidence required before implementation

- Live Storage bucket/object policy inventory.
- Test fixtures for province admin, Kab/Kota admin same region, Kab/Kota admin other region, and non-admin.
- Direct object and signed URL replay tests.
- Approved capability matrix.

### Status

`SEC-001: OPEN`

## 4. SEC-002 Minimum Profile Projection

### Target design

Use an explicit, approved detail projection. Candidate operational projection:

```text
id
full_name
birth_date
kabupaten_kota_id
license_level
license_expiry
profile_photo_url
is_active
is_profile_complete
afk_origin
created_at
kabupaten_kota: kabupaten_kota_id (id, name)
```

Document path fields should be included only in a capability-appropriate response path. Do not assume that hiding document controls makes document paths safe to fetch.

### Required decisions

- Whether birth date is needed in UI and export.
- Whether document paths can be returned in the general detail response.
- Whether a separate authorized document metadata/URL operation is required.
- Exact live profile columns and sensitivity classification.

### Implementation boundary

Changing `profiles.select("*")` is application contract work and must be tested against every existing detail field and mutation flow. It is not a schema change by itself, but it can break consumers if the projection is incomplete.

### Status

`SEC-002: OPEN`

## 5. SEC-003 RPC Authorization

### Target design

Replace the implicit public fallback with an explicit caller contract that is approved for each function:

```text
get_referees:
  authenticated caller required
  role = admin_provinsi OR admin_kab_kota
  admin_kab_kota constrained to caller region
  explicit safe return projection
  validated filters and bounded pagination

count_referees:
  same caller and region contract
  count matches the list contract
```

This is a conceptual target, not SQL to apply. Exact implementation may use existing authorization helpers only after their live behavior is verified.

### Required evidence

- Live function identity, owner, language, security mode, search path, and body.
- Live EXECUTE grants.
- Direct anon/authenticated role tests.
- Region-boundary tests.
- Dependency/call-site review for assignment and smart-assignment consumers.

### Status

`SEC-003: OPEN`

## 6. DATA-001 Region Contract

### Target decision options

Choose exactly one after owner review:

**Option A - Versioned RPC return contract**

- RPC returns `kabupaten_kota_id` and `kabupaten_kota_name`.
- Generated types are regenerated.
- All RPC consumers are checked for signature/return compatibility.

**Option B - Separate approved region lookup**

- RPC remains identifier-only.
- The application resolves names through an authorized, bounded region query.
- The lookup must not widen referee visibility or bypass region authorization.

Option A is more efficient for table/list rendering but may require a function return-signature migration. Option B may reduce RPC signature impact but adds a client dependency and consistency concerns.

### Required evidence

- Current live function signature/body.
- Existing migration history and dependent consumers.
- Generated type source/version.
- Approval of one authoritative source.

### Status

`DATA-001: OPEN`

## 7. REGION-001 and IDOR-001

### Target design

Every operation must bind the target to the caller’s authorization context server-side:

```text
list       -> role + region scope
count      -> same role + region scope
 detail    -> target referee + role + region scope
edit       -> target referee + role + region scope
status     -> target referee + role + region scope
document   -> target referee + document capability + region scope
export     -> same rows as approved list scope
```

Client filters and route guards are usability boundaries only.

### Required test matrix

| Actor | Same region list/detail/edit/status/document | Other region list/detail/edit/status/document |
|---|---|---|
| Province admin | Approved by owner | Approved by owner |
| Kab/Kota admin | Must be explicitly approved and verified | Must be denied unless contract explicitly permits |
| Panitia | Route/RPC behavior must be explicit | Must not inherit admin access |
| Wasit | Route/RPC behavior must be explicit | Must not inherit admin access |
| Evaluator | Route/RPC behavior must be explicit | Must not inherit admin access |

### Status

`REGION-001: OPEN`  
`IDOR-001: OPEN`

## 8. PERF-001 and PERF-002

### Target design

Do not modify performance behavior until authorization and return contracts are frozen.

Possible bounded contracts:

- Expiry predicate evaluated server-side with explicit date boundary and timezone.
- Count function accepts the same filters and expiry semantics.
- Stats function returns only approved aggregates and applies the same role/region scope.
- Every operation has bounded result size and index plan evidence.

### Required scale evidence

- Representative referee row counts.
- Query latency and bytes transferred.
- Browser memory/time for current client approach.
- Date-boundary correctness.
- Aggregate/list consistency.

### Status

`PERF-001: OPEN`  
`PERF-002: OPEN`

## 9. SEC-004 CSV Contract

### Target design

- Scope remains `Export halaman ini`.
- Field allowlist is approved before code changes.
- Default exclude birth date unless explicitly justified.
- Exclude document paths, tokens, internal identifiers, and credentials.
- Use a standards-compliant CSV serializer that doubles quotes and preserves commas/newlines.
- Neutralize formula-leading values according to an approved spreadsheet-safety policy.
- Add UTF-8/Unicode and CRLF tests.

### Status

`SEC-004: OPEN`

## 10. AUDIT-001 Event Contract

### Target design

Reuse existing `audit_logs` infrastructure. Do not create a second logging system.

Proposed event names require owner approval:

```text
REFEREE_PROFILE_EDIT
REFEREE_ACTIVATE
REFEREE_DEACTIVATE
REFEREE_DOCUMENT_VIEW
REFEREE_DOCUMENT_DOWNLOAD
REFEREE_EXPORT_PAGE
REFEREE_PERMISSION_DENIED
```

Each event should define:

```text
actor_id
entity_type = referee or approved document entity
entity_id
action
result
region context, if approved
changed field names, not secret values
document type, not document contents
row count/filter summary without sensitive values
created_at
```

For reliable security/compliance events, server-side writing is preferred. The current `writeAuditLog` hardcodes `entity_type: "event"`, so it cannot be reused as-is without contract review.

### Status

`AUDIT-001: OPEN`

## 11. QA-001 Test Architecture

### UI/application layer

Test pure state transitions and accessibility without replacing backend authorization with mocks. Cover the list/detail state matrix and page-only export wording.

### Backend contract layer

Use authorized test fixtures and direct calls to verify caller role, region, target ID, and returned fields. Tests must prove denial, not just hidden buttons.

### Storage layer

Test both signed URL issuance and direct object access. Validate view/download separation, expiry, and replay.

### Performance layer

Use representative data volumes and verify bounded queries rather than asserting only client render speed.

### Status

`QA-001: OPEN`

## 12. Migration / Rollback Design

### Migration required?

Unknown until live evidence and owner decisions are complete. Possible changes include RPC body/signature, grants, RLS, Storage policies, and generated client types.

### Rollback prerequisites

- Snapshot current live definitions and grants.
- Record migration hashes and dependent consumers.
- Capture pre-change role/region/IDOR/Storage test results.
- Maintain a reversible test-project migration sequence.
- Approve Production change separately.

### Rollback action

Restore the prior approved definitions/policies/types using a reviewed rollback migration, then rerun all negative-path tests. Never use an unreviewed blind replay or destructive reset.

## 13. Implementation File Plan After Approval

No implementation is authorized by this document. Expected future surfaces are:

- [src/hooks/useReferees.ts](../src/hooks/useReferees.ts): explicit projection/CSV only after approval.
- [src/hooks/useSignedUrl.ts](../src/hooks/useSignedUrl.ts): request gating only after capability contract approval.
- [src/pages/RefereeDetail.tsx](../src/pages/RefereeDetail.tsx): consume approved document/projection contract.
- [src/pages/Referees.tsx](../src/pages/Referees.tsx): consume approved region/export/performance contract.
- New focused tests under [src/test](../src/test).
- `supabase/migrations/*`, RLS, Storage, or RPC files only in a separately authorized backend phase.

## 14. Approval Gate

```text
PHASE 4:
AUDIT + REMEDIATION DESIGN COMPLETE

IMPLEMENTATION:
NOT STARTED

PRODUCTION:
READ-ONLY / NOT VERIFIED BEYOND PROJECT METADATA

NEXT AUTHORIZATION REQUIRED:
TEST-ENVIRONMENT FIXTURES + LIVE CONTRACT EVIDENCE
```

Do not proceed to implementation or Production remediation until the audit status changes from `BLOCKED — ADDITIONAL EVIDENCE REQUIRED` through explicit evidence and approval.
