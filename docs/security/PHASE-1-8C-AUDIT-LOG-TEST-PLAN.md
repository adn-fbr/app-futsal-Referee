# Phase 1.8C Audit Log Test Plan

## Status

**READY for isolated non-production execution; BLOCKED now.**

## Runtime objects

`audit_logs`, `activity_logs`, `auth_event_logs`, and `event_logs` are present in the recovered runtime public schema.

## Assertions

- Ordinary authenticated users cannot update or delete audit history.
- Ordinary users cannot insert arbitrary actor identities or privileged audit events.
- System/service-generated inserts record server-derived actor identity where applicable.
- Timestamps are server-controlled and not client-authoritative.
- Trigger-generated records exist for approval, honor, assignment, and authentication events where intended.
- Cross-region users cannot read audit history outside their approved scope.

Each test must distinguish `ALLOW`, `DENY`, `ERROR`, `UNEXPECTED ALLOW`, and `UNEXPECTED DENY`. Any ordinary-user mutation of audit history is a failure.

## Preconditions

Owner-confirmed isolated non-production project and disposable fixtures. Do not insert audit tests or alter logs in the unknown linked project.
