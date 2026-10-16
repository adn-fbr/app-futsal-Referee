# Phase 1.8 RLS Forensic Audit

## Status

**RUNTIME BLOCKED.** No RLS metadata or policy changes were performed. The actual linked database catalog has not yet been captured.

## Static policy evidence

Historical migrations and the RLS matrix show RLS enabled on many application tables, but policy definitions are distributed across overlapping migration histories. Static risks include:

- broad `FOR SELECT USING (true)` policies on regional reference tables;
- historical authenticated-wide or weak insert predicates;
- mixed event and assignment policies with partial tenant predicates;
- repeated policy drop/create operations with changing semantics;
- settings policies that require the Phase 1.4 filtered public view;
- SECURITY DEFINER helper dependencies that require catalog and function-body verification.

## Required runtime matrix

| Table | RLS | Force RLS | SELECT | INSERT | UPDATE | DELETE | Policy count | Runtime status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| all exposed application tables | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BLOCKED |

The actual values must come from `pg_class.relrowsecurity`, `relforcerowsecurity`, and `pg_policies`. No application data is required for this metadata audit.

## Risk classification

- **P0 if verified:** any cross-region read/write path or unscoped privileged mutation.
- **P1:** RLS enabled but missing policies, broad authenticated access, or policy/helper mismatch.
- **P1:** sensitive settings accessible outside the filtered security-invoker view.
- **P2:** reference-list public access where data classification permits it but documentation is absent.

## Runtime testing boundary

Normal-user RLS behavior, IDOR, and cross-region isolation are BLOCKED because production test identities and a non-production environment are unavailable. Service-role reads must not be interpreted as RLS evidence.
