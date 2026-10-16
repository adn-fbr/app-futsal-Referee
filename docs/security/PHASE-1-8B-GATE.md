# PHASE 1.8B — RUNTIME SCHEMA CATALOG RECOVERY GATE

Runtime Catalog: PASS
RBAC: PASS for enum; BLOCKED for assignments
Tenant Model: PASS for structural candidates; BLOCKED for data validation
RLS: PASS for enabled/policy catalog; BLOCKED for force flags and runtime behavior
SECURITY DEFINER: PASS for definitions; BLOCKED for complete privilege/caller safety
RPC: BLOCKED
Migration Drift: FAIL
Environment: BLOCKED

OVERALL:
BLOCKED

## Verified

- Project identity, project name, status, region, database host, PostgreSQL version, and CLI version.
- Read-only remote migration metadata connection.
- 55 local migrations with no matching remote versions in the CLI output.
- No database modification occurred.
- Read-only public schema dump completed successfully (113,595 bytes).
- 27 public tables and 27 RLS-enabled tables were documented.
- 3 views, 47 public functions, 41 SECURITY DEFINER declarations, 86 policies, and the five runtime enum values were documented.

## Blocked

Runtime row assignments, pg_roles membership, exact EXECUTE ACLs, force-RLS flags, and normal-user authorization behavior remain unavailable. Direct PostgreSQL access was not attempted without an approved password channel.

## Stop condition

Phase 1.8B does not pass. The next safe action is to provide an approved read-only database connection/catalog channel or make the exact CLI image available, then rerun the catalog-only export. No remediation is authorized by this report.
