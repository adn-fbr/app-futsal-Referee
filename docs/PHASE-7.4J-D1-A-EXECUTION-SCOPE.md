# PHASE 7.4J-D1-A EXECUTION SCOPE

## Scope

This document defines the gated execution scope for a future, separately approved Non-Production reconstruction.

## Execution target

- Non-Production project: shorsqyycpptxcutrqrb
- Production project: xfscfjwapwnkiinkgbjg

Execution must remain limited to the Non-Production target only.

## Allowed purpose

Canonical reconstruction of the Non-Production environment using the known Production baseline and dependency graph as the authoritative source of truth.

## Allowed operations

- schema reconstruction
- canonical functions
- canonical views
- canonical triggers
- canonical indexes
- canonical RLS
- synthetic Auth identities
- synthetic application fixtures
- synthetic Storage fixtures

## Explicitly prohibited

- Production reconstruction
- Production data copy
- Production Auth copy
- Production Storage copy
- blind replay of 55 historical migrations
- recreation of rejected duplicate function contract
- organization creation
- club creation
- membership creation
- organization_membership creation
- bypassing RLS
- use of SECURITY DEFINER without separate approval
- speculative indexes
- Production mutation

## Execution gate

Execution is blocked unless the operator explicitly approves the conditions in the D1-A authorization package and confirms:

- the target is the approved Non-Production project
- Auth is synthetic-only and non-enumerable through the current channel
- the project is disposable/rebuildable
- all canonical baseline and dependency artifacts are validated
- rollback and snapshot prerequisites are in place

If any gate fails, execution is blocked.
