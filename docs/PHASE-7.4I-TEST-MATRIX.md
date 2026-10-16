# PHASE 7.4I Test Matrix

**Status: DESIGN COMPLETE — NOT EXECUTED**

| ID | Scenario | Expected result |
|---|---|---|
| T01 | Valid input, duplicate found | Success; `isDuplicate=true`; bounded candidates |
| T02 | Valid input, no duplicate | Success; `isDuplicate=false`; `duplicates=[]` |
| T03 | Exact name match | Candidate ranked |
| T04 | Contains name match | Candidate ranked |
| T05 | Date proximity | Candidate ranked by approved behavior |
| T06 | Location absent | Location filter not applied |
| T07 | Region absent | Region filter not applied |
| T08 | Location filtering | Only matching authorized candidates |
| T09 | Event exclusion | Excluded event absent |
| T10 | Five-result maximum | At most five candidates |
| T11 | Similarity ordering | `similarity_score DESC` |
| T12 | Date ordering | `date DESC` after score |
| T13 | NULL optional input | Filter not applied |
| T14 | NULL database field | Does not match |
| T15 | NULL similarity | Not duplicate evidence; non-NULL first |
| T16 | Invalid required input | `ValidationError` |
| T17 | Database failure | `DatabaseError`; never no duplicate |
| T18 | RLS denial | `AuthorizationError` |
| T19 | Timeout | `TimeoutError` |
| T20 | Repeated execution | Deterministic ordered result |

Explicit invariant: **DATABASE ERROR != NO DUPLICATE**.
