# PHASE 7.4J-D0.9 RLS Reconstruction Model

Canonical target: 86 policies across 27 public tables, with RLS enabled on the exposed application tables. The exact policy declarations, including table, name, command, role, USING, and WITH CHECK, remain the `production-schema.sql` source of truth and are not re-authored here.

## Classification

- **CANONICAL_RECONSTRUCTABLE**: policy declarations whose target table and predicates are fully present in the frozen baseline.
- **EXTERNAL_AUTH_DEPENDENT**: policies using `auth.uid()`, `auth.users`, managed roles, or profile/role identity.
- **GOVERNANCE_REVIEW**: policies whose remote target is absent/drifted or whose function/predicate depends on unresolved migration conflicts.
- **UNKNOWN**: remote behavior not observable from the partial six-table schema.

The model preserves RLS enforcement, caller-authorized visibility, security-invoker views, and no browser/service-role bypass. `auth.users` remains external-managed. No policy was created or changed.