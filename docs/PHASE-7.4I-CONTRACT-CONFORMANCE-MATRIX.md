# PHASE 7.4I Contract Conformance Matrix

Contract hash: `7ccbcced5b3ebfd74b5eb4e60c6c89c8f878a4a1162f312c51121ad6a7ed4bc6`

| Contract clause | Design decision | Evidence | Planned target | Test |
|---|---|---|---|---|
| Five inputs | Exact five-field DTO | H contract; `useEvents.ts` | Repository input | T16, T20 |
| Candidate output | Six fields plus wrapper | H contract; `DuplicateEvent` | Repository/DTO | T01, T02, T15 |
| Matching | Name/date/filter/exclusion | H and historical migration | Rich query design | T03-T09 |
| Similarity | Ranking only; no threshold | D05-D06 | Query design | T11, T15 |
| Ordering | Score DESC, date DESC | D07 | Query design | T11, T12, T20 |
| Limit | Maximum 5; no pagination | D08 | Query design | T10 |
| NULL | Frozen NULL rules | D09 | Validation/query | T13-T15 |
| Errors | Typed error mapping | D10 | Repository | T16-T19 |
| Security/RLS | Invoker, caller context, no bypass | D11-D12; baseline policies | Database design TBD | T18 |
| Visibility | Caller-authorized rows | D13; events policy evidence | RLS validation | T08, T18 |
| Performance | Measure, explain, validate, index | D14-D15; existing indexes | Non-Production plan | Benchmark |
| Migration/rollback | Separate gates and testable rollback | D16-D19 | Future migration plan | Rollback suite |

**Status: PASS — DESIGN CONFORMANCE.** Physical identity remains TBD and is not invented.
