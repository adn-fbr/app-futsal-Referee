# Phase 1.8B Runtime RLS Inventory

## Status

**PASS for catalog recovery; security interpretation remains review-required.** The dump contains RLS enablement and policy definitions for all 27 public tables.

## Runtime facts

- RLS enabled: 27/27 public tables.
- RLS forced: not emitted as a complete catalog field by this dump and therefore not claimed.
- Policies: 86.

## Verified broad policies

The runtime dump contains `USING (true)` or `WITH CHECK (true)` policies including `Everyone can view events`, `Everyone can view event approvals`, `Everyone can view kabupaten_kota`, `Everyone can view pengurus`, `Everyone can view provinsi`, `Anyone can view reviews`, and `Anyone can submit reviews`.

These are verified policy expressions, not automatically vulnerabilities; their data classification and intended public access require owner review. They are P1 review candidates where rows contain sensitive or tenant-scoped data.

## Required output

For every public/auth/storage application table, record:

- schema and table;
- RLS enabled and forced flags;
- policy count;
- policy name, command, permissive/restrictive mode, roles, `USING`, and `WITH CHECK` expressions.

Explicitly identify RLS-enabled tables with zero policies and tables with multiple policies. Expressions must be analyzed for `true`, `anon`, `authenticated`, client-supplied identity/tenant fields, SECURITY DEFINER helper calls, recursive references, and mutation asymmetry.

## Static context only

The repository contains mixed historical policies, including broad reference-list reads and changing event/assignment/settings predicates. The dump now confirms the listed broad policies; normal-user runtime behavior remains untested.

## Gate

RLS catalog status: **PASS**. RLS authorization behavior: **BLOCKED**. No policy was changed.
