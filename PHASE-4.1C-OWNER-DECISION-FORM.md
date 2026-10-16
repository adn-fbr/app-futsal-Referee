# PHASE 4.1C — OWNER DECISION FORM

Purpose: record explicit owner decisions and authorizations for unresolved items identified in Phase 4.1B.

This form is decision-recording only. It does not authorize implementation, migration, fixture creation, production verification, or any source code/database change.

---

## OWNER SIGN-OFF

Owner name: AFP SULSEL

Decision date: ______________________________

Overall decision:
- [APROVE] AUTHORIZE PHASE 4.2
- [ ] DO NOT AUTHORIZE PHASE 4.2

Owner notes:

______________________________________________________________________________
______________________________________________________________________________
______________________________________________________________________________

---

## D-001 — DOCUMENT CAPABILITY MATRIX

Define whether each role may VIEW and DOWNLOAD:
- License document
- KTP document

Roles:
- admin_provinsi
- admin_kab_kota
- panitia
- evaluator
- wasit

Allowed values: ALLOW / DENY / UNKNOWN

| Role | License VIEW | License DOWNLOAD | KTP VIEW | KTP DOWNLOAD | Owner decision |
|---|---|---|---|---|---|
| admin_provinsi | ALLOW | ALLOW | ALLOW |ALLOW |APROVE|
| admin_kab_kota | ALLOW | DENY | ALLOW | DENY | APROVE |
| panitia | DENY | DENY | DENY | DENY | DENY | APROVE
| evaluator | DENY | DENY | DENY | DENY | DENY |APROVE
| wasit | ALLOW | DENY | ALLOW | DENY | APROVE |

Owner decision:
- [APROVE] APPROVE
- [ ] DEFER

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-002 — AUTHORITATIVE REGION CONTRACT

Choose exactly one:

### A
`get_referees` returns:
- kabupaten_kota_id
- kabupaten_kota_name

### B
Region name is resolved through a separate authoritative region lookup.

### C
DEFER

Owner selection:
- [APROVE] A
- [ ] B
- [ ] C

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-003 — CSV FIELD ALLOWLIST

Current candidate fields:
- full name
- license
- kabupaten/kota
- AFK origin
- status
- joined date
- birth date
- license expiry

Choose: INCLUDE / EXCLUDE / UNKNOWN

| Field | Decision |
|---|---|
| full name | INCLUDE |
| license | INCLUDE |
| kabupaten/kota | INCLUDE |
| AFK origin | INCLUDE |
| status | INCLUDE |
| joined date | INCLUDE |
| birth date | INCLUDE |
| license expiry | EXCLUDE |

Owner decision:
- [APROVE ] APPROVE
- [ ] DEFER

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-004 — ACCOUNT STATE SEMANTICS

Choose one:

### A
`is_active = true` → `Aktif`

`is_active = false` → `Non-Aktif`

### B
Existing `is_active` does not represent the complete business status and another authoritative status model exists.

### C
DEFER

Owner selection:
- [APROVE ] A
- [ ] B
- [ ] C

If B, identify the authoritative status source:

______________________________________________________________________________

Notes:

______________________________________________________________________________

---

## D-005 — LICENSE EXPIRY SEMANTICS

### Expired condition
Choose one:
- [ ] `license_expiry < current date`
- [ ] Other explicit rule: _______________________________________________

### Boundary
Specify behavior when `license_expiry = today`:

______________________________________________________________________________

### Timezone
Choose one:
- [APROVE ] Asia/Makassar
- [ ] UTC
- [ ] database timezone
- [ ] other: ____________________

### Automatic state impact
Choose one:
- [ ] No automatic change to `is_active`
- [APROVE] Automatically deactivate
- [ ] Other:
- [ ] Defer

Owner approval:
- [ APROVE] APPROVE
- [ ] DEFER

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-006 — AUDIT EVENT REQUIREMENTS

Decide whether the following events are mandatory:

- REFEREE_PROFILE_EDIT
- REFEREE_ACTIVATE
- REFEREE_DEACTIVATE
- REFEREE_DOCUMENT_VIEW
- REFEREE_DOCUMENT_DOWNLOAD
- REFEREE_EXPORT_PAGE
- REFEREE_PERMISSION_DENIED

Allowed values: REQUIRED / NOT REQUIRED / DEFER

| Event | Decision |
|---|---|
| REFEREE_PROFILE_EDIT | REQUIRED |
| REFEREE_ACTIVATE | REQUIRED |
| REFEREE_DEACTIVATE | REQUIRED |
| REFEREE_DOCUMENT_VIEW | REQUIRED |
| REFEREE_DOCUMENT_DOWNLOAD | REQUIRED |
| REFEREE_EXPORT_PAGE | REQUIRED |
| REFEREE_PERMISSION_DENIED | REQUIRED |

### Audit writer
Choose one:
- [APROVE] Server-side mandatory
- [ ] Client-side acceptable
- [ ] Either
- [ ] Defer

Owner decision:
- [APROVE ] APPROVE
- [ ] DEFER

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-007 — REGION BOUNDARY BY ACTION

For `admin_kab_kota`, define whether access to a referee from another region is:
- ALLOW / DENY / DEFER

| Action | Same Region | Foreign Region |
|---|---|---|
| LIST | ALLOW | DENY |
| DETAIL | ALLOW | DENY |
| EDIT | DENY | DENY |
| ACTIVATE | DENY | DENY |
| DEACTIVATE | DENY | DENY |
| DOCUMENT VIEW | ALLOW | DENY |
| DOCUMENT DOWNLOAD | DENY | DENY |
| EXPORT | DENY | DENY |

For `admin_provinsi`, specify whether province-wide scope applies:
- [ APROVE] YES
- [ ] NO
- [ ] DEFER

Owner approval:
- [APROVE ] APPROVE
- [ ] DEFER

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-008 — REFEREE CREATION WORKFLOW

Choose one:

### A
Existing `/users` workflow is the official referee creation workflow.

### B
Create a separate referee onboarding workflow.

### C
No referee creation from `/referees`.

### D
Defer.

Owner selection:
- [APROVE ] A
- [ ] B
- [ ] C
- [ ] D

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-009 — PERFORMANCE THRESHOLD

Define the operational contract for:
- referee list
- expiry filtering
- summary statistics
- export

At minimum define whether client-side full-result retrieval is acceptable for:

| Dataset size | Decision |
|---|---|
| <100 | ______ |
| 100–500 | ______ |
| 500–1,000 | APROVE |
| 1,000–5,000 | ______ |
| >5,000 | ______ |

Optional explicit budget:
- Maximum acceptable query latency: ____________________ ms
- Maximum browser payload: ____________________ MB
- Maximum rows retrieved: ____________________

Owner approval:
- [APROVE] APPROVE
- [ ] DEFER

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-010 — TEST FIXTURE AUTHORIZATION

Environment:
`test APP — shorsqyycpptxcutrqrb`

Authorize creation of isolated synthetic fixtures:
- [ APROVE] YES
- [ ] NO

If YES, authorize:
- [APROVE] actor fixtures
- [APROVE] referee_A
- [APROVE] referee_B
- [APROVE] non-referee target
- [APROVE] LICENSE_A
- [APROVE] KTP_A
- [APROVE] LICENSE_B
- [APROVE] KTP_B

Fixture data must be synthetic and must not contain real personal documents.

Owner authorization:
- [ APROVE] AUTHORIZE
- [ ] DENY

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-011 — TEST CREDENTIAL AUTHORIZATION

Authorize controlled test identities for:
- admin_provinsi
- admin_kab_kota_A
- admin_kab_kota_B
- authenticated_non_admin
- anonymous/unauthenticated context where applicable

Owner authorization:
- [ APROVE] AUTHORIZE
- [ ] DENY

Credential handling rule:
- credentials must never be printed in reports;
- passwords/tokens must never be committed;
- service-role keys must never be used in browser tests;
- test secrets must remain outside source control.

If identities already exist, identify them only by safe non-secret identifiers.

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## D-012 — PRODUCTION READ-ONLY AUTHORIZATION

Production:
`AFP SULSEL — xfscfjwapwnkiinkgbjg`

Authorize controlled read-only verification of:
- RPC metadata
- RPC grants
- RPC definitions
- RLS policies
- Storage policies
- role-scoped behavior
- region isolation
- IDOR behavior

Authorization:
- [APROVE] AUTHORIZE READ-ONLY
- [ ] DENY
- [] DEFER

Explicit restriction:
> This authorization does NOT permit INSERT, UPDATE, DELETE, DDL, migration, GRANT, REVOKE, policy modification, function modification, Storage mutation, or application deployment.

Notes:

______________________________________________________________________________
______________________________________________________________________________

---

## AUTOMATED VALIDATION RULES

The next phase must treat the form as valid only if:

1. D-001 has an explicit matrix.
2. D-002 has A/B/C.
3. D-003 has an explicit field matrix.
4. D-004 has an explicit status rule.
5. D-005 has expiry, boundary, timezone, and state-impact decisions.
6. D-006 has event and writer decisions.
7. D-007 has action-level region rules.
8. D-008 has A/B/C/D.
9. D-009 has explicit operational thresholds or an accepted documented policy.
10. D-010 explicitly authorizes or denies fixtures.
11. D-011 explicitly authorizes or denies test identities/access.
12. D-012 explicitly authorizes or denies production read-only verification.

No blank field may be silently interpreted as approval.

---

## FINAL STATUS

This form does not authorize implementation.

After owner decisions are recorded, the next phase must determine whether:
- READY FOR PHASE 4.2
- BLOCKED — OWNER DECISION(S) REMAIN
- BLOCKED — TEST ACCESS / FIXTURE AUTHORIZATION
- BLOCKED — PRODUCTION READ-ONLY AUTHORIZATION

No implementation may begin before that validation gate passes.
