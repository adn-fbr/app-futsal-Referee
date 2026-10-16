# PHASE 4.1 - Remediation Readiness

Status: **BLOCKED - OWNER CONTRACT DECISION REQUIRED**

This document assesses whether each finding is ready for implementation. `Implementation Ready = YES` requires an approved contract, sufficient live/test evidence, and an executable test strategy. No finding meets all three conditions.

## 1. Implementation Readiness Matrix

| Finding | Contract resolved? | Live evidence? | Test fixture? | Implementation ready? | Blocking reason |
|---|---|---|---|---|---|
| SEC-001 Sensitive documents | No | No | No document objects | NO | Capability matrix and Storage policy/evidence missing |
| SEC-002 Broad projection | No | Partial static only | No role fixtures | NO | Minimum field/sensitivity owner decision missing |
| SEC-003 RPC authorization | No | No live grants/behavior | No authorized sessions | NO | Caller/role/region contract and direct RPC evidence missing |
| SEC-004 CSV injection | No | Static serializer evidence only | UI/unit fixtures can be local | NO | Field allowlist and spreadsheet safety policy missing |
| DATA-001 Region contract | No | Static drift only | No consumer contract test | NO | RPC-return versus separate lookup decision missing |
| REGION-001 Region boundary | No | No live RLS/RPC behavior | Actor/target pairs not frozen | NO | Same/foreign region product and backend evidence missing |
| IDOR-001 Direct ID access | No | No live behavior | Target pairs not frozen | NO | Object-level authorization evidence missing |
| PERF-001 Expiry filtering | No | Static cost only | No scale benchmark dataset | NO | Date semantics and scale thresholds missing |
| PERF-002 Statistics | No | Static cost only | No scale benchmark dataset | NO | Aggregate contract and scale thresholds missing |
| AUDIT-001 Audit events | No | Infrastructure exists; requirements unknown | No event execution fixtures | NO | Taxonomy, writer, retention, and entity contract missing |
| QA-001 Focused tests | No | Coverage gap statically established | Auth/Storage fixtures missing | NO | Security tests cannot execute defensibly without fixtures |

## 2. Readiness Decision by Layer

### UI-only

Potentially ready after product approval:

- Local CSV serializer unit tests.
- Pure state/formatting tests.
- Documentation and test harness scaffolding that does not call Supabase.

These do not close backend security findings.

### Application contract

Blocked by Q5-Q12:

- explicit profile projection;
- region-name source;
- export allowlist;
- date/status semantics;
- capability-aware document request minimization.

### Database/RPC/RLS

Blocked by live function/grant/policy evidence and explicit authorization. No SQL remediation is authorized.

### Storage/security

Blocked by capability decision, live Storage policy inventory, and synthetic document fixtures. No object or policy operation is authorized.

### Test-only

Blocked by exact actor/target pairing, authorized sessions, and fixture availability. No fixture creation is authorized.

## 3. Required Inputs to Unblock

1. Product owner decisions for Q1-Q4 and Q9-Q15.
2. Security/backend owner decision for RPC caller and region contracts.
3. Authorized read-only or controlled test-environment access for live grants, RLS, and Storage inventory.
4. Explicit authorization for synthetic test identities and application fixtures.
5. Synthetic license/KTP objects or an approved Storage fixture mechanism.
6. Exact actor/target pair manifest, stored outside committed secrets.
7. Approved expected result classes for every negative-path case.
8. Scale benchmark plan or approved representative datasets.

## 4. Remediation Decision Tree

```text
Product contract approved?
  NO -> OWNER DECISION REQUIRED
  YES
    |
    v
Backend behavior evidenced?
  NO -> LIVE SECURITY EVIDENCE REQUIRED
  YES
    |
    v
Authorized test fixture available?
  NO -> TEST FIXTURE / AUTHORIZATION REQUIRED
  YES
    |
    v
Focused negative-path tests pass?
  NO -> REMEDIATION REQUIRED
  YES
    |
    v
IMPLEMENTATION READY
```

## 5. Safe Work That May Proceed Independently

Without changing source or backend:

- finalize this contract register;
- finalize fixture/test manifests;
- write local pure CSV test cases without changing production serializer;
- prepare read-only query scripts for authorized execution;
- prepare evidence capture format;
- review consumer dependency graph for `get_referees`.

## 6. Work Explicitly Blocked

- Provisioning or updating Auth/profile/role fixtures.
- Uploading or deleting Storage objects.
- Direct RPC execution requiring credentials not provided.
- Production schema/grant/RLS/Storage inspection that requires unavailable live connection.
- Any migration, DDL, DML, RPC replacement, policy change, or Edge Function deployment.
- Changing source to claim a contract is resolved.

## 7. Final Gate

```text
PHASE 4.1 CONTRACT REGISTER: COMPLETE
PHASE 4.1 FIXTURE DESIGN: COMPLETE
PHASE 4.1 SECURITY MATRIX: COMPLETE
PHASE 4.1 READINESS MATRIX: COMPLETE

IMPLEMENTATION READY: NO
TEST FIXTURES AVAILABLE: NO / NOT AUTHORIZED
LIVE SECURITY EVIDENCE: UNAVAILABLE

FINAL STATUS:
BLOCKED — OWNER CONTRACT DECISION REQUIRED
```
