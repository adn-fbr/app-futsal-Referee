# PHASE 1.8AZ — N15 Controlled Re-Entry / Negative-Path Execution Gate

**Date:** 2026-09-24  
**Project:** Test `shorsqyycpptxcutrqrb`  
**Production:** `xfscfjwapwnkiinkgbjg`  
**Mode:** Controlled negative-path re-entry / execution gate  

## 1. Objective

Re-open N15 after Phase 1.8AY and prove the frozen negative-path contract:

> authenticated actor → `public.generate_card_number(uuid)` → DENY

Required proof is an actual application-authenticated session. `SET ROLE authenticated` is not accepted as a substitute.

## 2. Phase 1.8AY remediation status

The Test project remediation was applied:

```sql
REVOKE EXECUTE
ON FUNCTION public.generate_card_number(uuid)
FROM PUBLIC, anon, authenticated;
```

Static post-state verification:

- function exists: PASS
- SECURITY DEFINER: TRUE, unchanged
- owner: `postgres`
- PUBLIC EXECUTE: FALSE
- anon EXECUTE: FALSE
- authenticated EXECUTE: FALSE
- function body unchanged: PASS

## 3. N15 execution preflight

### Application-authenticated actor evidence

The connected Opera browser currently has an AFP Referee Test application tab at:

`http://localhost:8080/referee/id-card`

The page is an authenticated Wasit application context and displays the Test card for the Wasit account. This confirms an authenticated application session is present in the browser.

No JWT, access token, refresh token, cookie, password, or other credential was extracted or requested.

### Execution capability check

The available browser connector can inspect the rendered application but does not provide a controlled arbitrary HTTP POST/RPC invocation primitive. The Supabase SQL channel can execute SQL with database privileges, but cannot impersonate the user's real application-authenticated JWT session for this test.

Therefore the exact N15 RPC call cannot be safely executed under the frozen AT protocol from the currently available tooling.

## 4. Frozen execution contract

Target:

`public.generate_card_number(uuid)`

Actor:

Authenticated Wasit application session.

Expected result:

`DENY`, preferably PostgreSQL authorization failure `42501` / permission denied.

The RPC must not be invoked through `SET ROLE authenticated`.

The target referee UUID must not be exposed in the artifact beyond the minimum fixture binding required by the execution harness.

## 5. Abort-first determination

No N15 RPC execution was attempted.

Reason: execution would require either:

1. an actual application-authenticated RPC request from the browser/network layer, or
2. another approved execution mechanism capable of attaching the real authenticated session.

Neither is available through the current controlled tooling interface.

Using SQL `SET ROLE authenticated` would violate the frozen execution protocol and is therefore prohibited.

## 6. Result

**N15 = BLOCKED / NOT EXECUTED**

This is not PASS and not FAIL.

The authorization remediation itself is already statically verified. The remaining missing evidence is the runtime negative-path proof through a genuine authenticated application session.

## 7. Safety counters

- Production mutation: 0
- Test mutation from N15 RPC: 0
- DDL/DML during N15 execution: 0
- N15 RPC execution: 0
- Provider calls: 0
- Secret reads: 0
- Token/cookie collection: 0

## 8. Sequence control

Because N15 has not yet produced a runtime PASS, the frozen abort-first rule remains active.

**N16 MUST NOT be executed.**

No subsequent negative-path case is opened by this gate.

## 9. Required next action

Provide an authorized mechanism for one controlled POST to the Supabase RPC endpoint using the already-authenticated Test application session, without exposing or transmitting credentials in chat.

The exact request must target:

`generate_card_number(uuid)`

and must capture only:

- HTTP status
- error category / SQLSTATE where exposed
- redacted response shape
- pre/post invariant state
- confirmation that no protected row/counter/audit/notification changed

After that single case closes with DENY and unchanged invariants, N15 can be marked PASS and the sequence may proceed to the next authorized gate.
