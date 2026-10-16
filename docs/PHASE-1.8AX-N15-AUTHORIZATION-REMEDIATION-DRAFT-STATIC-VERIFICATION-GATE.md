# PHASE 1.8AX — N15 Authorization Remediation Draft & Static Verification Gate

**Date:** 2026-09-24  
**Project:** Test `shorsqyycpptxcutrqrb`  
**Production:** `xfscfjwapwnkiinkgbjg` — READ-ONLY / untouched  
**Mode:** REMEDIATION DRAFT + STATIC VERIFICATION ONLY  
**DDL/DML execution:** NOT EXECUTED  
**RPC N15 execution:** NOT EXECUTED

---

## 1. Gate Objective

Close the N15 authorization-contract discrepancy identified during Phase 1.8AW.

Frozen N15 expectation: an authenticated actor invoking `generate_card_number(uuid)` must be denied because the function is an internal helper and is not part of the browser-callable RPC contract.

Current Test metadata shows that `public.generate_card_number(uuid)` remains executable by both `anon` and `authenticated`.

This phase is limited to:

1. freeze the remediation candidate;
2. verify that no current database-side canonical caller requires browser execution;
3. define the exact privilege boundary change;
4. define the post-remediation static verification;
5. establish the gate before any actual DDL is applied.

No Production change and no N15 RPC execution are authorized in this phase.

---

## 2. Frozen Finding

Target: `public.generate_card_number(uuid)`

| Property | Current | Expected |
|---|---:|---:|
| Function exists | YES | YES |
| SECURITY DEFINER | TRUE | Internal helper only |
| search_path | `public` | controlled |
| anon EXECUTE | **TRUE** | **FALSE** |
| authenticated EXECUTE | **TRUE** | **FALSE** |
| N15 expected outcome | DENY | DENY |

Executing N15 before remediation would therefore risk an unexpected successful call and violates abort-first.

---

## 3. Caller Reconciliation

Read-only inspection found no public database function body containing a call to `generate_card_number` outside the target function.

The inspected card paths use the atomic `referee_card_counters` allocator directly rather than the legacy `MAX(...)+1` implementation in `generate_card_number`.

Relevant paths include:

- `issue_my_referee_card()`
- `regenerate_my_referee_card()`
- `issue_referee_card_for_admin(uuid)`
- `bulk_issue_referee_cards()`
- `renew_referee_card(uuid)`
- `revoke_referee_card(uuid,text)`
- `update_referee_card_status(uuid,text,text)`
- `regenerate_referee_card_for_admin(uuid)`

A database-side source scan for `%generate_card_number%` returned no other public function definitions containing that call.

**Result: PASS — no database-side caller dependency identified.**

This does not replace a repository-wide application-source dependency scan if that evidence is required by the migration gate.

---

## 4. Remediation Candidate — NOT EXECUTED

```sql
REVOKE EXECUTE
ON FUNCTION public.generate_card_number(uuid)
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.generate_card_number(uuid)
FROM anon;

REVOKE EXECUTE
ON FUNCTION public.generate_card_number(uuid)
FROM authenticated;
```

Rationale: PostgreSQL grants EXECUTE on newly created functions to `PUBLIC` by default unless changed. Revoking from `PUBLIC` is therefore the authoritative boundary operation. Explicit role revokes are retained for audit readability and defense-in-depth documentation.

No grant to `anon` or `authenticated` is proposed.

The function is not dropped in this phase; object retirement, if desired, is a separate lifecycle decision.

---

## 5. Post-Remediation Static Verification Contract

After an explicitly authorized Test-only privilege remediation, verify:

```sql
SELECT
  p.oid::regprocedure AS signature,
  p.prosecdef AS security_definer,
  p.proconfig AS config,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.oid = 'public.generate_card_number(uuid)'::regprocedure;
```

Required result:

```text
signature              = generate_card_number(uuid)
anon_execute           = false
authenticated_execute  = false
```

`SECURITY DEFINER` may remain temporarily because this phase addresses the execution boundary. It must not be interpreted as browser-safe authorization.

---

## 6. N15 Re-entry Contract

Only after the privilege remediation is applied and statically verified may N15 be reopened.

Actor: real application-authenticated session.

Target: `public.generate_card_number(uuid)`.

Expected: DENY.

`SET ROLE authenticated` is not an acceptable substitute for an authenticated application session.

No JWT, access token, refresh token, cookie, password, or other credential may be requested or stored as evidence.

N15 must remain a one-case controlled execution under the Phase 1.8AT protocol.

---

## 7. Abort-First Conditions

Abort immediately if:

1. `anon` or `authenticated` retains EXECUTE;
2. an unexpected internal caller is discovered;
3. unrelated privileges change;
4. the function definition changes unexpectedly;
5. N15 succeeds when DENY is expected;
6. protected rows mutate;
7. `referee_card_counters` changes;
8. `referee_cards` changes;
9. an unintended audit event is created;
10. notification/ledger side effects occur;
11. sensitive target data is disclosed;
12. Production is touched.

---

## 8. Production Safety Gate

Production `xfscfjwapwnkiinkgbjg` remains strictly read-only.

This phase authorizes none of the following on Production:

- DDL
- DML
- GRANT
- REVOKE
- RPC execution
- migration
- deployment

---

## 9. Safety Counters

| Counter | State |
|---|---:|
| Production mutation | 0 |
| Test mutation | 0 |
| DDL/DML execution | 0 |
| Migration execution | 0 |
| Deployment | 0 |
| Provider calls | 0 |
| Secret reads | 0 |
| N15 RPC execution | 0 |

---

## 10. Gate Decision

**Static remediation draft: PASS**

The proposed boundary change is deterministic and limited to execution privileges for `public.generate_card_number(uuid)`.

**Database-side caller reconciliation: PASS**

No other public database function body currently references the helper.

**Static post-state contract: DEFINED**

Expected post-remediation state:

```text
anon EXECUTE          = FALSE
authenticated EXECUTE = FALSE
```

**Actual remediation: NOT EXECUTED**

**N15 negative-path execution: NOT EXECUTED**

# FINAL STATUS

**PHASE 1.8AX = PASS — REMEDIATION DRAFT / STATIC VERIFICATION GATE**

**Next required gate:**

`PHASE 1.8AY — Test Authorization Remediation Apply Gate`

That gate must explicitly authorize the Test-only `REVOKE EXECUTE` remediation, verify the post-state, and only then reopen N15 under the frozen one-case execution protocol.

**Do not proceed to N16 until N15 is re-opened and PASS.**
