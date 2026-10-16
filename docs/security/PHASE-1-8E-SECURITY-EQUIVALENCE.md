# Phase 1.8E Security Equivalence

## Status

**BLOCKED** pending test-project creation and baseline application.

## Reference security facts

Production runtime reference contains 27 RLS-enabled public tables, 86 policies, 41 SECURITY DEFINER functions among 47 public functions, 3 security-invoker views, five `app_role` values, and broad table grants to `anon`, `authenticated`, and `service_role`.

## Required equivalence checks

- Every reference table has matching RLS enablement.
- Policy names, commands, roles, `USING`, and `WITH CHECK` expressions match the approved reference or an explicitly reviewed test-only difference.
- SECURITY DEFINER function count, signatures, owners, search paths, and definitions match.
- Function EXECUTE privileges match the approved test contract.
- Views retain security-invoker behavior.
- Triggers and audit paths match.
- Table/function/view grants are intentional and documented.
- Enum values exactly match the reference.

## Safety note

Equivalence is not a security PASS. Broad production policies and grants must be behaviorally tested in the isolated project. No production policy or grant may be changed to make equivalence easier.
