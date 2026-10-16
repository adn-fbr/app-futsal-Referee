# PHASE-7.4E-D Formal Decision Register

Version: v1.0.0
Status: BLOCKED

The register contains exactly 19 remaining governance items from Phase 7.4E-C. No item is silently approved.

| ID | Contract dimension | Current evidence | Proposed decision | Status | Authority | Rationale |
| --- | --- | --- | --- | --- | --- | --- |
| D-01 | Function identity | Canonical exists; rich function does not | TBD | DEFERRED | Database / Architecture Owner | Rich name/schema/signature absent |
| D-02 | Schema | `public` exists; new placement unspecified | TBD | DEFERRED | Database / Architecture Owner | Historical unqualified SQL is insufficient |
| D-03 | Function name | Historical/application name is `check_duplicate_event` | TBD | DEFERRED | Database / Architecture Owner | Cannot reuse/overload canonical name automatically |
| D-04 | Signature | Historical five args; canonical three | TBD | BLOCKED | Database / Architecture Owner | Material conflict |
| D-05 | Return type | Historical TABLE; canonical boolean | TBD | BLOCKED | Database / Architecture Owner | Incompatible return behavior |
| D-06 | Input 1 | Application `p_name`; canonical `p_kota_id` | TBD | BLOCKED | Business/Database Owners | No lossless mapping |
| D-07 | Input 2 | Application `p_date`; canonical `p_location` | TBD | BLOCKED | Business/Database Owners | No lossless mapping |
| D-08 | Input 3 | Application `p_location`; canonical `p_name` | TBD | BLOCKED | Business/Database Owners | No lossless mapping |
| D-09 | Matching fields | Historical name/date/location/region/exclusion | TBD | DEFERRED | Business Owner | Policy not approved |
| D-10 | Similarity threshold | No cutoff evidenced | NO_THRESHOLD or TBD | DEFERRED | Business/Technical Owners | No numeric threshold evidence |
| D-11 | Pagination | Historical LIMIT 5; no pagination | TBD | DEFERRED | Technical Owner | Policy not established |
| D-12 | Error semantics | Hook throws; EventEdit proceeds | TBD | DEFERRED | Technical/Security Owners | Fail-open behavior needs approval |
| D-13 | Security model | Canonical and historical are SECURITY DEFINER | TBD | BLOCKED | Security Owner | Historical security is not authorization |
| D-14 | RLS behavior | RLS authoritative; rich visibility unproven | TBD | BLOCKED | Security/Database Owners | Execution model absent |
| D-15 | Cross-scope leakage | Optional region filter | TBD | BLOCKED | Security Owner | Caller filter is not authorization |
| D-16 | Performance target | No SLA; historical query bounded | TBD | DEFERRED | Technical Owner | Dataset/latency/timeout absent |
| D-17 | Indexes | pg_trgm present; no index evidence | TBD | DEFERRED | Database / Architecture Owner | Extension does not approve index |
| D-18 | Migration | Future sequence only | TBD | DEFERRED | Database/Deployment Owners | Separate authorization required |
| D-19 | Rollback | Conceptual only | TBD | DEFERRED | Deployment Owner | Operational details absent |

Formal contract status: `BLOCKED`. Primary authority is Database / Architecture Owner; reviewers are Business, Product, Technical, Security, and Deployment Owners. Names and timestamps are not available.
