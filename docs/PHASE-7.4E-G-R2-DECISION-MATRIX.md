# PHASE 7.4E-G-R2 Decision Matrix

The matrix uses only the authoritative D01-D19 universe. NC-01 through NC-10 are not decision IDs and were not created.

| ID | Title | Authority Decision | Status | Conditions |
|---|---|---|---|---|
| D01 | Function identity | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Canonical identity unchanged; separate rich identity |
| D02 | Input contract | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Five inputs; exact signature recorded |
| D03 | Return contract | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Boolean canonical; rich schema versioned |
| D04 | Matching semantics | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Evidence-established semantics only |
| D05 | Similarity model | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Ranking only |
| D06 | Threshold | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | No fixed numeric threshold |
| D07 | Ordering | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | `similarity_score DESC, date DESC`; deterministic/public |
| D08 | Limit | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Default maximum 5; no implicit pagination |
| D09 | NULL semantics | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Deterministic validation/filter/NULL behavior |
| D10 | Error semantics | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Database failure is not no duplicate |
| D11 | Security model | APPROVE | APPROVED | SECURITY INVOKER |
| D12 | RLS | APPROVE | APPROVED | RLS enforced; no bypass |
| D13 | Data visibility scope | APPROVE | APPROVED | Caller-authorized visibility |
| D14 | Performance target | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Measure, explain, validate, then index |
| D15 | Index strategy | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | No speculative index |
| D16 | Migration strategy | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Non-Production boundary only |
| D17 | Rollback | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Testable rollback required |
| D18 | Baseline impact | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Baseline immutable |
| D19 | Deployment boundary | APPROVE WITH CONDITIONS | CONDITIONALLY_APPROVED | Production separate authorization |

## Classification

- Critical groups: **9/9 resolved**
- Non-critical D-ID classification: **UNRESOLVED**
- NC IDs created: **0**
