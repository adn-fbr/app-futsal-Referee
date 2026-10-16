# PHASE 1.8AY — Test Authorization Remediation Apply Gate

**Date:** 2026-09-24
**Mode:** TEST ONLY / CONTROLLED AUTHORIZATION REMEDIATION
**Test project:** `shorsqyycpptxcutrqrb`
**Production project:** `xfscfjwapwnkiinkgbjg`

## 1. Objective

Apply the frozen N15 authorization remediation to Test only, then verify the resulting function ACL before reopening N15.

## 2. Frozen finding

Function: `public.generate_card_number(uuid)`

Pre-remediation state:
- SECURITY DEFINER: TRUE
- owner: `postgres`
- PUBLIC EXECUTE: TRUE
- anon EXECUTE: TRUE
- authenticated EXECUTE: TRUE

N15 contract requires the function to be internal-only and denied to browser roles.

## 3. Authorized remediation

```sql
REVOKE EXECUTE
ON FUNCTION public.generate_card_number(uuid)
FROM PUBLIC, anon, authenticated;
```

No function drop, replacement, body modification, grant, RLS change, fixture creation, or application deployment is included.

## 4. Execution result

The remediation was executed against **Test `shorsqyycpptxcutrqrb` only**.

Result: SQL execution completed without error.

Production: **NOT TOUCHED**.

## 5. Post-remediation static verification

Verified state:

| Property | Result |
|---|---|
| Signature | `generate_card_number(uuid)` |
| SECURITY DEFINER | TRUE |
| PUBLIC EXECUTE | FALSE |
| anon EXECUTE | FALSE |
| authenticated EXECUTE | FALSE |
| Function body changed | NO |

This satisfies the N15 authorization contract.

## 6. Advisor observation

The Test security advisor still reports multiple unrelated SECURITY DEFINER findings. The remediation target `generate_card_number(uuid)` is no longer present as an anon/authenticated executable finding. Existing advisor findings are outside this gate and are not treated as resolved by this single-function change.

## 7. N15 re-entry rule

N15 may now be reopened only through the frozen Phase 1.8AT controlled negative-path protocol.

Required execution:
- actual authenticated application session
- no `SET ROLE authenticated` substitute
- no token/JWT/cookie disclosure
- exact frozen function signature
- no production execution
- capture SQLSTATE/error category and return-shape behavior
- verify no protected state mutation

Expected result: **DENY** because browser roles no longer possess EXECUTE.

## 8. Abort-first conditions

Abort immediately if:
- N15 unexpectedly succeeds;
- any protected row changes;
- any card counter changes;
- sensitive data is returned;
- an unexpected audit/notification side effect occurs;
- the actual session cannot be established safely;
- execution would require sharing credentials/tokens.

## 9. Safety counters

- Production mutation: 0
- Production DDL/DML: 0
- Test remediation statements: 1 controlled REVOKE
- N15 RPC execution: 0 at this gate
- Fixture creation: 0
- Provider calls: 0
- Secret reads: 0
- Application deployment: 0

## 10. Gate decision

**PHASE 1.8AY = PASS — TEST AUTHORIZATION REMEDIATION APPLIED AND STATICALLY VERIFIED**

The N15 discrepancy is closed at the authorization layer.

### Next gate

**PHASE 1.8AZ — N15 Controlled Re-Entry / Negative-Path Execution Gate**

Do not proceed to N16 until N15 is executed through the approved authenticated-session path and records **PASS**.
