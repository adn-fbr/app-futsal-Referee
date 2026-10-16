# PHASE 7.4E-G-R Unresolved Decisions

## D07 — Ordering

- Current status: **PENDING**
- Authority decision evidence: None. CD-04 mentions historical ordering as a condition, but does not provide an individual D07 decision.
- Missing evidence: Explicit authority decision, ordering contract status, authority identity/date/reference.
- Required authority action: Decide whether `similarity_score DESC, date DESC` is the public contract ordering.

## D08 — Limit

- Current status: **PENDING**
- Authority decision evidence: None.
- Missing evidence: Explicit authority decision on maximum result count and whether `LIMIT 5` is contractual.
- Required authority action: Decide maximum result count and contract status.

## D09 — NULL Semantics

- Current status: **PENDING**
- Authority decision evidence: None.
- Missing evidence: Explicit decisions for NULL input, NULL database field, and NULL similarity behavior.
- Required authority action: Decide all NULL semantics.

## D10 — Error Semantics

- Current status: **PENDING**
- Authority decision evidence: None. CD-05 is a security execution decision and does not decide invalid input, no result, database error, permission error, or timeout behavior.
- Missing evidence: Explicit error-policy decision and authority evidence.
- Required authority action: Decide invalid input, no result, database error, permission error, and timeout behavior.

## NC-01 Through NC-10

Each NC item remains `PENDING` because the authoritative Final Decision Register contains D01-D19 only and defines no NC identifier, title, original question, or mapping.

| NC ID | Decision ID | Title | Original Question | Authority Decision | Conditions | Authority Evidence | Required Action |
|---|---|---|---|---|---|---|---|
| NC-01 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-02 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-03 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-04 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-05 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-06 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-07 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-08 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-09 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |
| NC-10 | NOT DETERMINABLE | NOT PROVIDED | NOT PROVIDED | PENDING | NOT PROVIDED | PENDING AUTHORITY EVIDENCE | Supply exact D01-D19 mapping |

## Gate Impact

- Pending individual decisions: **D07-D10 (4)**
- Pending non-critical reconciliation items: **NC-01 through NC-10 (10)**
- Critical mapping inconsistency: **C05 includes D10-D11, but only D11 has an explicit authority position**
- Final gate: **BLOCKED**
