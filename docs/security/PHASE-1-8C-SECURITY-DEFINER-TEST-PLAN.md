# Phase 1.8C SECURITY DEFINER Test Plan

## Status

**READY for isolated non-production execution; BLOCKED now.**

## Static hypotheses

The runtime dump contains 41 SECURITY DEFINER functions with `search_path = public`. This is a fixed path but does not explicitly include `pg_temp`; exact owners, ACLs, dynamic SQL, and caller behavior require review.

## Test categories

1. Anonymous invocation of every sensitive SECURITY DEFINER RPC: expected `DENY` unless explicitly public.
2. Authenticated ordinary-user invocation of role, audit, approval, region, card, honor, assignment, and user-sensitive functions: expected `DENY` unless contract permits.
3. Caller-supplied `_user_id`, `user_id`, role, region, and resource IDs: verify server identity/scope overrides or rejects them.
4. Cross-region resource IDs: expected `DENY`.
5. Trigger-driven functions: verify behavior through isolated fixture mutations without direct function execution where possible.
6. Dynamic SQL/search-path review: confirm no unsafe unqualified resolution or attacker-controlled object resolution.

## Evidence

Record function signature, caller, ACL, input class, result classification, error, and whether the operation changed a disposable fixture. No production execution or hardening is permitted.
