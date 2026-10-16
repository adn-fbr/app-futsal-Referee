# PHASE-7.4B Migration Impact

Version: v1.0.0
Status: GOVERNANCE_DECISION_REQUIRED

| Area | Impact | Current decision |
| --- | --- | --- |
| Repository migration | HIGH | BATCH-01 cannot create a duplicate-search repository method yet |
| Application behavior | HIGH | Direct five-argument call remains unchanged and blocked |
| Authentication | MEDIUM | Future contract must define authenticated caller requirements |
| Authorization | CRITICAL | Event visibility, region scope, and exclusion input require explicit rules |
| RLS | CRITICAL | Function execution and source-row visibility need separate review |
| RPC contract | CRITICAL | Three-argument boolean and five-argument table-returning contracts are incompatible |
| Data model | MEDIUM | Existing `events` columns are referenced; no new column is authorized |
| Baseline | HIGH | Option B/C requires a new approved baseline revision, never in-place editing |
| Dependency graph | HIGH | New approved function must be represented in a new graph revision |
| Testing | HIGH | Contract, authorization, result-shape, performance, and regression tests required |
| Rollback | HIGH | Must preserve current canonical function and provide reversible application adoption |

No migration, schema change, baseline edit, dependency update, repository implementation, or application refactor is authorized by this proposal.
