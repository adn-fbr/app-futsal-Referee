# PHASE 1.8AP — Disposable Negative-Path Fixture Design & Rollback-Safe Fixture Contract

Status: BLOCKED — DESIGN/FIXTURE CONTRACT ONLY
Mode: READ-ONLY / NO EXECUTION
Project: Test `shorsqyycpptxcutrqrb`
Production: untouched

## 1. Objective
Define disposable fixtures required for controlled negative-path tests without creating permanent business data or relying on Production data.

## 2. Fixture classes

### F01 — Cross-user card fixture
- Subject A: eligible wasit with active card.
- Subject B: different eligible wasit with active card.
- Purpose: prove user A cannot operate on card B.
- Required assertions: card B unchanged; counter unchanged; no unauthorized audit side effect.

### F02 — Cross-region admin fixture
- Admin A: `admin_kab_kota` in region A.
- Admin B: `admin_kab_kota` in region B.
- Target entity: card/registration/event in opposite region.
- Purpose: prove regional isolation.
- Required assertions: target unchanged; no disclosure beyond expected denial.

### F03 — Event-assignment fixture
- Assignment owned by wasit A.
- Optional second assignment owned by wasit B.
- Purpose: cross-user and invalid transition denial.
- Required assertions: status, reason, updated_at and audit state unchanged on denial.

### F04 — Event-completion fixture
- Event in `DISETUJUI` state.
- Region-bound admin actor.
- Purpose: prove authorized/unauthorized completion boundary.
- Required assertions: unauthorized attempt does not change event state, completion approval, or notification intents.

### F05 — Registration fixture
- Disposable pending profile in a valid region.
- Required only for registration authorization tests.
- Current Test state has 0 pending profiles; therefore this fixture is NOT currently available.
- Creation requires explicit execution authorization and must be transaction/rollback safe.

### F06 — Notification fixture
- Existing notification intent may be used only for read-only state inspection.
- Claim/finalize functions must not be executed during negative-path readiness.
- Purpose: verify browser actors cannot access internal notification RPCs.

## 3. Fixture safety rules
1. Never create fixtures in Production.
2. Prefer existing Test rows when they satisfy the contract.
3. Do not alter existing business rows merely to manufacture a negative-path case.
4. If creation is necessary, use a disposable namespace/transaction strategy where supported.
5. Capture pre-state before every mutation-capable test.
6. One mutation-capable case per execution boundary.
7. Abort immediately on unexpected mutation or disclosure.
8. Post-state must prove fixture cleanup or exact rollback.

## 4. Fixture binding record
Each fixture must record:
- fixture ID
- actor class
- actor user ID (internal evidence only; redact in report where unnecessary)
- role
- region ID
- target entity/type/ID
- initial state hash or minimal state snapshot
- expected authorization result
- cleanup/rollback method
- evidence timestamp

## 5. Rollback contract
A fixture is execution-ready only when:
- all mutated rows can be uniquely identified;
- pre-state is captured;
- rollback path is deterministic;
- no external provider call is required;
- no secret is needed;
- cleanup cannot accidentally affect unrelated production-like data;
- post-test verification can prove restoration.

## 6. Current readiness
- F01–F04: structurally pairable from existing Test data, subject to final actor/session binding.
- F05: BLOCKED — no pending registration fixture.
- F06: read-only only; no claim/finalize execution authorized.

## 7. Abort-first conditions
Abort if:
- fixture creation touches Production;
- existing business data must be permanently changed;
- rollback cannot be proven;
- actor/region binding is ambiguous;
- target row is shared by another test;
- external provider invocation is required;
- sensitive credential/token must be captured.

## 8. Gate
BLOCKED — fixture design is defined, but controlled execution remains unauthorized. No DDL, DML, RPC mutation, migration, deployment, provider call, or secret read performed.

Safety counters: Production mutations 0; Test mutations 0; DDL 0; DML 0; migrations 0; deployments 0; provider calls 0; secret reads 0.

Next: PHASE 1.8AQ — Fixture Allocation, Collision Check & Execution-Order Freeze.
