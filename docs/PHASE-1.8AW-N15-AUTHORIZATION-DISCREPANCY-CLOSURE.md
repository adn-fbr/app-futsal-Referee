# PHASE 1.8AW — N15 Authorization Discrepancy Closure

**Date:** 2026-09-24  
**Project:** Test `shorsqyycpptxcutrqrb`  
**Mode:** READ-ONLY / NO EXECUTION / NO DDL  
**Gate:** BLOCKED — N15 discrepancy must be resolved before negative-path sequence may continue.

## 1. Trigger

N15 is frozen as:

> authenticated actor → `public.generate_card_number(uuid)` → DENY / internal-only.

The preflight check found a live authorization contract that contradicts the frozen negative-path expectation.

## 2. Verified live state

Function:

`public.generate_card_number(uuid)`

Current properties:

- `SECURITY DEFINER = true`
- `search_path = public`
- `anon EXECUTE = true`
- `authenticated EXECUTE = true`
- returns `varchar`
- accepts arbitrary `p_referee_id uuid`

The function reads `profiles`, `kabupaten_kota`, and `referee_cards`, calculates a card sequence with `MAX(...) + 1`, and returns a generated card number.

**No RPC was executed.**

## 3. Caller/dependency read-only check

A source scan of public PL/pgSQL function bodies found **no other public function body referencing `generate_card_number`**.

The currently relevant card issuance/admin functions use their own atomic `referee_card_counters` allocator rather than calling this helper. This includes the observed self-service and admin card issuance paths.

Therefore, the current evidence supports treating `generate_card_number(uuid)` as an obsolete/uncontracted browser-callable helper rather than a required browser API.

## 4. Security interpretation

This is not a failed N15 execution. It is a **pre-execution authorization-contract failure**.

The test must not invoke the function merely to demonstrate that the authorization is wrong. Doing so could expose a generated identifier and would violate the abort-first rule.

N15 status:

**ABORTED / BLOCKED BEFORE RPC EXECUTION**

## 5. Required remediation candidate

Before resuming the negative-path sequence, the authorization boundary should be changed so that browser roles cannot execute this function.

Candidate database boundary:

```sql
REVOKE EXECUTE ON FUNCTION public.generate_card_number(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_card_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_card_number(uuid) FROM authenticated;
```

This is a **candidate only**. It has NOT been applied in this phase.

If a future internal caller is discovered, it must receive an explicit least-privilege grant to the required non-browser execution role instead of restoring PUBLIC/`anon`/`authenticated` access.

## 6. Required post-remediation verification

After an explicitly authorized migration/remediation gate:

1. Verify `anon EXECUTE = false`.
2. Verify `authenticated EXECUTE = false`.
3. Verify `SECURITY DEFINER` and `search_path` remain intentional.
4. Re-run the caller/dependency inventory.
5. Confirm canonical card issuance functions still use `referee_card_counters` and do not require this helper.
6. Only then reopen N15 for a controlled authenticated negative-path execution, subject to the Phase 1.8AT authorization gate.
7. If N15 unexpectedly succeeds, abort the entire sequence immediately.

## 7. Safety counters at closure

- Production mutation: **0**
- Test mutation: **0**
- DDL: **0**
- DML: **0**
- N15 RPC execution: **0**
- Migration: **0**
- Deployment: **0**
- Provider calls: **0**
- Secret reads: **0**

## 8. Gate result

**PHASE 1.8AW: BLOCKED**

The correct next work item is authorization-contract remediation and static re-verification. Do **not** continue to N16 while N15 remains unresolved.
