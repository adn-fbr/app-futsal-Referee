# PHASE 1.8T — Controlled Test Dry-Run & Abort-First Verification

Date: 2026-09-24
Mode: READ-ONLY / EXECUTION NOT PERFORMED
Project: test APP (`shorsqyycpptxcutrqrb`)

## Gate

**BLOCKED — controlled mutation dry-run was NOT executed.**

The Test project pre-execution state was rechecked read-only. The canonical notification internal RPC boundary remains intact:
- claim/finalize notification RPCs: anon DENY, authenticated DENY
- event-completion claim/finalize RPCs: anon DENY, authenticated DENY
- create event-completion intents: anon DENY, authenticated DENY

The canonical notification tables remain RLS-enabled and internal-only by contract.

## Abort-first decision

A transactional migration execution is not safe to start from the currently available candidate because the final exact replacement bodies for the Production 42-function boundary have not been independently frozen as an executable SQL artifact. In particular:

1. `verify_referee_card(text)` requires final bounded-output and atomic-counter body verification.
2. `soft_delete_record()` remains unresolved in lineage and must not be assumed trigger-only.
3. Privileged reporting RPCs remain deny-by-default and have no frozen browser caller contract.
4. Test already contains newer canonical notification/card contracts that must not be overwritten by a generic Production replay.
5. The Test project is not a clean Production clone; convergence must be object-aware.

Therefore an abort-first gate correctly prevents DDL/DML/ACL mutation at this stage.

## Verified Test boundary

The following internal notification functions currently have both `anon` and `authenticated` EXECUTE denied:
- `claim_event_completion_notification(uuid,uuid,text)`
- `claim_notification_channel(uuid,text,uuid)`
- `create_event_completion_notification_intents()`
- `finalize_event_completion_notification(uuid,uuid,text,uuid,text,text,text,text,text)`
- `finalize_notification_channel(uuid,text,uuid,text,text,bigint,text)`

## Required next gate

**PHASE 1.8U — Candidate SQL Materialization & Exact Function-Body Freeze**

Before any Test mutation, produce one canonical executable candidate containing:
- exact `CREATE OR REPLACE FUNCTION` bodies;
- exact ACL statements;
- exact RLS/object assertions;
- explicit preservation clauses for existing Test contracts;
- transaction wrapper;
- abort-first preconditions;
- postconditions;
- rollback strategy.

No Production mutation is authorized by this phase.

## Safety counters

Production mutation: 0
Test mutation: 0
DDL: 0
DML: 0
Migration applied: 0
Deployment: 0
Provider calls: 0
Secret reads: 0
