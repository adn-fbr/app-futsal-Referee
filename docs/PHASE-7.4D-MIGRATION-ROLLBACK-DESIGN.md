# PHASE-7.4D Migration and Rollback Design

Version: v1.0.0
Status: DESIGN ONLY

## Future sequence

1. Approve business requirement and acceptance criteria.
2. Approve exact rich-search contract, security model, and performance targets.
3. Implement only in an authorized non-Production environment.
4. Validate function identity, return contract, RLS, security, and performance.
5. Implement repository contract and application integration under a separate authorization.
6. Run unit, contract, security, regression, and UAT tests.
7. Approve Production schema deployment.
8. Deploy through the authorized process.
9. Re-extract the catalog and validate the new schema.
10. Generate a new canonical baseline revision and dependency graph.

No step was executed.

## Rollback requirements

| Layer | Trigger | Rollback design |
| --- | --- | --- |
| Application | Contract or regression failure | Revert repository/consumer adoption; retain canonical boolean path |
| Repository | Adapter failure | Disable rich-search method and preserve existing interface behavior where authorized |
| Function/schema | Security, performance, or contract failure | Use an approved reversible migration; exact SQL is TBD / GOVERNANCE REQUIRED |
| Compatibility | Existing caller breakage | Keep canonical function unchanged; do not drop or replace it |
| Baseline | Catalog validation failure | Do not alter current baseline; reject new revision and restore approved artifact set |
| Production | Deployment gate failure | Stop deployment and follow approved operational rollback; no ad hoc SQL |

Rollback triggers, SQL concept, retention period, and approval authority are `TBD / GOVERNANCE REQUIRED`. No rollback SQL was written or executed.
