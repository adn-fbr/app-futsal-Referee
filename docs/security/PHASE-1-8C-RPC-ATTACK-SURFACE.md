# Phase 1.8C RPC Attack Surface Plan

## Status

**READY for isolated non-production execution; BLOCKED now.**

## Static/runtime inventory basis

The runtime dump recovered 47 public functions, including role helpers, regional helpers, reporting functions, card functions, audit functions, validation functions, and trigger helpers. 41 are SECURITY DEFINER. Exact EXECUTE ACLs remain incomplete.

## Priority RPC matrix

| Function class | Examples | Inputs to attack | Expected authorization |
| --- | --- | --- | --- |
| Role | `has_role`, `is_admin*` | forged user/role | derive identity from auth; no client escalation |
| Region | `can_access_region`, `get_accessible_regions` | forged user/region | server-resolved region scope |
| Reporting | `get_audit_logs`, dashboard/referee reports | region/user filters | role and region constrained |
| Card | `generate_card_number`, `verify_referee_card` | referee/card/code IDs | public behavior explicitly approved; mutations restricted |
| Workflow | honor/assignment/approval validators | foreign resource IDs | resource and role checks |
| Mutation | `auto_mark_expired_cards`, workflow handlers | direct anonymous/auth calls | trusted system or authorized actor only |

For each function record caller role, EXECUTE ACL, SECURITY DEFINER, identity/role/region parameters, mutation, sensitive output, result classification, and evidence.

Do not invoke mutation RPCs against the unknown linked project.
