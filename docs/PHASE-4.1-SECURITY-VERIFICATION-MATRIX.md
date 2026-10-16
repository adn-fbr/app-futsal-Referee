# PHASE 4.1 - Security Verification Matrix

Status: **DESIGN ONLY - NO VERIFICATION EXECUTED**  
Target: test APP `shorsqyycpptxcutrqrb` only

Legend:

- `PRODUCT DECISION`: what the application should allow.
- `SECURITY EVIDENCE`: what the backend currently allows; currently unavailable for live execution.
- `REMEDIATION`: change required if evidence differs from the approved decision.
- `UNKNOWN`: deliberately unresolved.

## 1. Document Capability Matrix

| Capability | `admin_provinsi` | `admin_kab_kota` | `panitia` | `evaluator` | `wasit` |
|---|---|---|---|---|---|
| View license document | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Download license document | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| View KTP | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Download KTP | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

### Safe default

`DO NOT BROADEN ACCESS`. Current UI intent is province-admin-only for document controls, but this is not verified backend authorization.

## 2. Storage Verification Cases

| Case | Actor | Target/object | Expected result | Evidence required | Status |
|---|---|---|---|---|---|
| S-001 | Province admin | Own approved `LICENSE_A` | Product decision required; likely allow if approved | Signed URL + object access | BLOCKED fixture |
| S-002 | Province admin | Own approved `KTP_A` | Product decision required; likely allow if approved | Signed URL + object access | BLOCKED fixture |
| S-003 | Kab/Kota A | `LICENSE_A` | UNKNOWN until owner decision | Signed URL result and policy trace | BLOCKED fixture |
| S-004 | Kab/Kota A | `LICENSE_B` | Deny unless explicitly approved | Direct/signed access denial | BLOCKED fixture |
| S-005 | Non-admin | `LICENSE_A` | Deny | Direct/signed access denial | BLOCKED fixture |
| S-006 | Anonymous | known object path | Deny unless public contract exists | Direct object response | BLOCKED fixture |
| S-007 | authorized actor | valid signed URL during TTL | Access according to approved capability | HTTP access within TTL | BLOCKED fixture |
| S-008 | any actor | expired signed URL | Deny | HTTP access after expiry | BLOCKED fixture |
| S-009 | role revoked/changed | new request | Re-evaluate capability and deny if no longer allowed | New signed URL request | BLOCKED fixture |
| S-010 | role revoked/changed | existing signed URL | Record actual replay behavior separately; do not assume revocation | Access replay result | BLOCKED fixture |

Storage policy inventory is not available from live test metadata in this phase. No Storage mutation is authorized.

## 3. Direct RPC Authorization Matrix

Expected results below are **proposed product/security contract**, not observed behavior.

| Caller | `get_referees` | `count_referees` | Scope expectation |
|---|---|---|---|
| Anonymous | DENY unless approved public contract | DENY unless approved public contract | No administrative data |
| Authenticated non-admin | DENY | DENY | No administrative data |
| `admin_provinsi` | ALLOW after verification | ALLOW after verification | All approved regions |
| `admin_kab_kota` same region | ALLOW after verification | ALLOW after verification | Own region only |
| `admin_kab_kota` foreign region filter | DENY or constrained result | DENY or constrained result | Must not widen scope |
| `panitia` | DENY unless separately approved | DENY unless separately approved | No admin referee data |
| `evaluator` | DENY unless separately approved | DENY unless separately approved | No admin referee data |
| `wasit` | DENY for administrative list/count | DENY | Own/self-service contract separate |

### Direct RPC cases

- null region filter;
- valid own region;
- valid foreign region;
- invalid region UUID;
- excessive limit;
- negative/large offset;
- search for active/inactive records;
- active/inactive filter;
- no JWT;
- authenticated non-admin JWT.

Live grants, function body, and behavior are **NOT VERIFIED**.

## 4. Region Capability Matrix

### Proposed product contract

| Actor | Own region list/detail/edit/activate/deactivate/document/export | Foreign region list/detail/edit/activate/deactivate/document/export |
|---|---|---|
| Province admin | Owner decision required; proposed allow within approved all-region scope | Owner decision required; proposed allow within approved all-region scope |
| Kab/Kota A | Owner decision required; proposed allow | Proposed deny/constrain |
| Kab/Kota B | Owner decision required; proposed allow | Proposed deny/constrain |
| Panitia | No administrative capability unless separately approved | No administrative capability |
| Evaluator | No administrative capability unless separately approved | No administrative capability |
| Wasit | No administrative capability; self-service separate | No administrative capability |

### Required test cases

For each capability, execute A→A, A→B, B→A, Province→A, Province→B:

```text
LIST
DETAIL
EDIT
ACTIVATE
DEACTIVATE
DOCUMENT VIEW
DOCUMENT DOWNLOAD
EXPORT PAGE
```

No case is executable until exact actors and target pairs are authorized.

## 5. IDOR Matrix

| Target | Detail | Edit | Activate/deactivate | Document view/download | Expected safe outcome |
|---|---|---|---|---|---|
| Same-region referee | Test | Test | Test | Test | Owner-approved allow or deny |
| Foreign-region referee | Test | Test | Test | Test | DENIED / NOT FOUND / EMPTY RESULT |
| Non-wasit profile | Test | Test | Test | Test | DENIED / NOT FOUND / EMPTY RESULT |
| Unknown UUID | Test | Test | Test | Test | DENIED / NOT FOUND / EMPTY RESULT |
| Malformed UUID | Test | Test | Test | Test | Validation error without disclosure |

Route guard and hidden buttons do not count as IDOR evidence.

## 6. RLS Policy Inventory Matrix

Live policies are not verified. Inventory required for:

| Table/object | SELECT | UPDATE | INSERT | DELETE | Region predicate | Status |
|---|---|---|---|---|---|---|
| `profiles` | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BLOCKED live inventory |
| `user_roles` | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | N/A/UNKNOWN | BLOCKED live inventory |
| `kabupaten_kota` | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | N/A/UNKNOWN | BLOCKED live inventory |
| `storage.objects` | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BLOCKED live inventory |

Static migration evidence includes regional profile policies in historical artifacts, but it is not current live proof.

## 7. CSV Verification Matrix

| Case | Input | Expected safe output |
|---|---|---|
| C-001 | ordinary name | quoted valid cell |
| C-002 | embedded `"` | doubled quote inside quoted cell |
| C-003 | comma | retained inside quoted cell |
| C-004 | CRLF/newline | retained safely inside quoted cell |
| C-005 | Unicode/Indonesian text | valid UTF-8 output |
| C-006 | `=SUM(A1:A2)` | formula-neutralized according to approved policy |
| C-007 | `+cmd` / `-cmd` / `@cmd` | formula-neutralized according to approved policy |
| C-008 | approved field allowlist | no KTP/license paths, signed URLs, tokens, credentials |
| C-009 | page count | exactly current loaded page rows |

Current serializer is not compliant with C-002, C-006, or C-007. No change was made.

## 8. Performance Verification Matrix

| Dataset scale | Expiry rows/bytes/time | Stats rows/bytes/time | Browser work/memory | Status |
|---:|---|---|---|---|
| 10 | Measure | Measure | Measure | Not run |
| 100 | Measure | Measure | Measure | Not run |
| 500 | Measure | Measure | Measure | Not run |
| 1,000 | Measure | Measure | Measure | Not run |
| 5,000 | Measure | Measure | Measure | Not run |
| 10,000 | Measure | Measure | Measure | Not run |

Do not create 10,000 records without separate test-data authorization. Use representative approved datasets or a query-plan/benchmark harness that does not touch Production.

## 9. Audit Event Verification Matrix

| Event | Actor | Entity | Required metadata | Writer decision | Status |
|---|---|---|---|---|---|
| `REFEREE_PROFILE_EDIT` | admin | referee ID | changed field names, result, region | server/client UNKNOWN | Contract open |
| `REFEREE_ACTIVATE` | admin | referee ID | old/new state, result, region | server/client UNKNOWN | Contract open |
| `REFEREE_DEACTIVATE` | admin | referee ID | old/new state, result, region | server/client UNKNOWN | Contract open |
| `REFEREE_DOCUMENT_VIEW` | authorized actor | referee/document type | result, type, actor | server preferred | Contract open |
| `REFEREE_DOCUMENT_DOWNLOAD` | authorized actor | referee/document type | result, type, actor | server preferred | Contract open |
| `REFEREE_EXPORT_PAGE` | admin | list scope | row count, safe filter summary | server/client UNKNOWN | Contract open |
| `REFEREE_PERMISSION_DENIED` | attempting actor | target/capability | reason code, result | server preferred | Contract open |

## 10. Evidence Status

```text
LIVE RPC AUTHORIZATION: NOT VERIFIED
LIVE RLS: NOT VERIFIED
LIVE STORAGE: NOT VERIFIED
LIVE REGION ISOLATION: NOT VERIFIED
LIVE IDOR: NOT VERIFIED
FIXTURES: NOT AVAILABLE / NOT AUTHORIZED
```
