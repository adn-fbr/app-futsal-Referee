# Phase 1.8C Role Escalation Test Plan

## Status

**READY for isolated non-production execution; BLOCKED now.**

## Fixtures

Use fixed role assignments: `wasit`, `panitia`, `evaluator`, `admin_kab_kota`, and `admin_provinsi`. Do not modify roles during the test run.

## Matrix

- `wasit` attempts platform, regional-admin, operator, evaluator, role-management, audit, import/export, and user-management operations: expected `DENY` unless explicitly authorized by the approved contract.
- `admin_kab_kota` attempts another region's administration: expected `DENY`.
- `panitia` attempts role assignment, global user management, and another region's resources: expected `DENY`.
- `evaluator` attempts role, user, and unrelated-region mutations: expected `DENY`.
- Authorized role plus authorized resource scope: expected `ALLOW` only where documented.

## Identity/role spoofing

Send forged `role` fields and role-like query parameters. The database-resolved role and authenticated identity must control authorization. Client role input must never upgrade privileges.

## Preconditions

Isolated non-production users and resources only. No role assignment, deletion, or escalation attempt against the unknown linked project.
