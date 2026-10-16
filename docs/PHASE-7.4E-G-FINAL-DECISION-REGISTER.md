# PHASE 7.4E-G Final Decision Register

## Record Status

- Input: Phase 7.4E-F = **BLOCKED**
- Option: **OPTION C — SEPARATE RESPONSIBILITIES**
- Canonical contract: `public.check_duplicate_event(text,text,text) RETURNS boolean`
- Canonical status: **UNCHANGED**
- Human decision authority: **REQUIRED**
- Current register status: **BLOCKED**

This register is intentionally unapproved. No AI or recommendation has been recorded as a human decision.

## Decision Statuses

Allowed human decisions are `APPROVE`, `APPROVE WITH CONDITIONS`, `REJECT`, and `DEFER`. Until an authorized authority records one, the register status is `PENDING`.

| ID | Decision | Evidence | Recommendation | Authority | Status | Human Decision | Approved By | Date | Reference | Conditions |
|---|---|---|---|---|---|---|---|---|---|---|
| D01 | Function identity | Canonical three-argument boolean function exists | Separate rich-search capability; do not modify canonical | Database/Architecture Owner | PENDING | blank | blank | blank | blank | blank |
| D02 | Input contract | Application has five inputs | Preserve observed five-input semantics; exact signature TBD | Database/Architecture Owner | PENDING | blank | blank | blank | blank | blank |
| D03 | Return contract | Rich result needs `isDuplicate` and candidates | Separate rich result contract; exact type TBD | Architecture and Database Owners | PENDING | blank | blank | blank | blank | blank |
| D04 | Matching semantics | Name/date/location/region/exclusion observed | No new fields; approve observed semantics only | Business/Product and Architecture Owners | PENDING | blank | blank | blank | blank | blank |
| D05 | Similarity model | Historical CASE scoring exists | Retain only with explicit approval | Architecture and Business Owners | PENDING | blank | blank | blank | blank | blank |
| D06 | Threshold | No numeric threshold evidenced | Ranking signal; no invented threshold | Business/Product and Architecture Owners | PENDING | blank | blank | blank | blank | blank |
| D07 | Ordering | Score DESC then date DESC observed | Retain observed ordering | Architecture Owner | PENDING | blank | blank | blank | blank | blank |
| D08 | Limit | Historical `LIMIT 5` | Retain maximum 5 unless Product changes it | Product and Architecture Owners | PENDING | blank | blank | blank | blank | blank |
| D09 | NULL semantics | Null optional filters disable filters historically | Preserve only if approved | Architecture Owner | PENDING | blank | blank | blank | blank | blank |
| D10 | Error semantics | Exact database error contract absent | Review fail-open behavior; exact policy TBD | Architecture and Security Owners | PENDING | blank | blank | blank | blank | blank |
| D11 | Security model | Historical SECURITY DEFINER is not authorization | Prefer SECURITY INVOKER; exception needs approval | Security and Database Owners | PENDING | blank | blank | blank | blank | blank |
| D12 | RLS | Rich visibility is not proven | Respect RLS; no bypass | Security and Database Owners | PENDING | blank | blank | blank | blank | blank |
| D13 | Data visibility scope | Tenant/cross-scope model absent | Do not invent one; approve visibility explicitly | Business and Security Owners | PENDING | blank | blank | blank | blank | blank |
| D14 | Performance | Dataset/SLA targets absent | Set measurable targets before implementation | Performance and Product Owners | PENDING | blank | blank | blank | blank | blank |
| D15 | Index strategy | `pg_trgm` alone does not approve index | Query-plan/workload review first | Database Owner | PENDING | blank | blank | blank | blank | blank |
| D16 | Migration strategy | Future controlled sequence only | No migration now; separate Production gate | Database/Architecture and Deployment Owners | PENDING | blank | blank | blank | blank | blank |
| D17 | Rollback | Exact rollback not approved | Preserve canonical and make adoption reversible | Database/Architecture and Deployment Owners | PENDING | blank | blank | blank | blank | blank |
| D18 | Baseline impact | Current baseline `UNCHANGED` | New revision only after authorized change/extraction | Database Governance Owner | PENDING | blank | blank | blank | blank | blank |
| D19 | Implementation/deployment boundary | Gates are separate | Production deployment remains separate authorization | Deployment Owner | PENDING | blank | blank | blank | blank | blank |

## Counts

- Total decisions: 19
- Approved: 0
- Conditionally approved: 0
- Pending: 19
- Deferred: 0
- Rejected: 0
- Critical decisions: 9
- Critical resolved: 0

## Boundary

- Contract: **PROVISIONAL / BLOCKED**
- Non-Production implementation: **NOT AUTHORIZED**
- Production migration: **NOT AUTHORIZED**
- Production deployment: **NOT AUTHORIZED**
- Application modifications: **0**
- Database modifications: **0**
- Migrations: **0**
- Production access: **NOT EXECUTED**
- Production mutation: **NOT EXECUTED**
- Baseline: **UNCHANGED**

**Next gate: AUTHORITY DECISION.**
