# PHASE-7.4E-A Decision Matrix

Version: v1.0.0
Status: BLOCKED

| # | Item | Decision | Rationale | Authority | Evidence |
| ---: | --- | --- | --- | --- | --- |
| 1 | Function name | TBD | No approved rich-search name exists; canonical name must not be reused | Database / Architecture Owner | 7.4D detailed contract |
| 2 | Schema | TBD | No placement for a new function is approved | Database / Architecture Owner | 7.4D schema impact |
| 3 | Exact signature | TBD | Historical five-argument shape is evidence, not approval | Database / Architecture Owner | 7.4A historical evidence |
| 4 | Argument semantics | TBD | Five observed semantics are documented but not governance-approved | Business and Database Owners | 7.4A argument matrix |
| 5 | Return type | TBD | Historical table result is not an approved contract | Database / Architecture Owner | 7.4D return design |
| 6 | Returned fields | TBD | Observed fields require data-visibility approval | Security and Business Owners | 7.4D mapping |
| 7 | Matching fields | TBD | Evidence lists name/date/location/region/exclusion, but final policy is open | Business Owner | 7.4D matching matrix |
| 8 | Matching normalization | TBD | No approved normalization rule | Technical and Business Owners | 7.4D matching matrix |
| 9 | Similarity algorithm | TBD | Historical CASE logic exists; pg_trgm does not establish a required algorithm | Database / Architecture Owner | 7.4D performance review |
| 10 | Similarity threshold | TBD | No threshold was approved | Business and Technical Owners | 7.4D performance review |
| 11 | Result ordering | TBD | Deterministic ordering rule is unspecified | Database / Architecture Owner | 7.4D result design |
| 12 | Result limit | TBD | No bounded result policy was approved | Technical Owner | 7.4D performance review |
| 13 | Pagination | TBD | Offset/keyset choice is unspecified | Technical Owner | 7.4D performance review |
| 14 | Security model | TBD | Invoker/definer choice and privileges are unresolved | Security Owner | 7.4D security review |
| 15 | EXECUTE privileges | TBD | Roles and grants are not approved | Security and Database Owners | 7.4D security review |
| 16 | Authentication requirement | TBD | Authenticated versus anonymous access is not approved | Security Owner | 7.4D security review |
| 17 | RLS behavior | TBD | RLS remains authoritative, but rich-search visibility is unspecified | Security and Database Owners | 7.4D security review |
| 18 | Cross-scope leakage protection | TBD | Region/event visibility rules are unresolved | Security Owner | 7.4D security review |
| 19 | Required indexes | TBD | No query shape/workload evidence approves an index | Database / Architecture Owner | 7.4D performance review |
| 20 | Performance target | TBD | Dataset, latency, timeout, and concurrency targets are absent | Technical Owner | 7.4D performance review |
| 21 | Error semantics | TBD | Error and fail-closed behavior are not approved | Technical and Security Owners | 7.4D mapping |
| 22 | Empty-result semantics | TBD | Empty result behavior requires product decision | Product Owner | 7.4D mapping |
| 23 | Application DTO mapping | APPROVED AS OBSERVED | Existing DTO is evidence only; no implementation authorization follows | Technical Owner | 7.4A matrix, 7.4D mapping |
| 24 | Repository boundary | APPROVED AS DIRECTION | Repository boundary is the required architecture; method contract remains TBD | Technical Owner | 7.4C/7.4D architecture |
| 25 | Backward compatibility | APPROVED AS RULE | Existing canonical function remains unchanged; rich search must be additive if approved | Database / Architecture Owner | Immutable baseline rule |
| 26 | Migration strategy | TBD | Future sequence exists, but no implementation or deployment approval exists | Database and Deployment Owners | 7.4D migration design |
| 27 | Rollback strategy | TBD | Rollback design is conceptual and lacks approved operational details | Deployment Owner | 7.4D rollback design |
| 28 | Baseline revision strategy | APPROVED AS RULE | New revision only after authorized implementation, validation, and extraction | Database / Architecture Owner | Baseline governance rule |

## Gate

Implementation-critical items 1-22, 26, and 27 remain TBD. Formal result: `BLOCKED`.
