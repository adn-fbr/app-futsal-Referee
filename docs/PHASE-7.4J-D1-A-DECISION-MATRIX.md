# PHASE 7.4J-D1-A DECISION MATRIX

## Decision register

| decision_id | decision | rationale | risk | mitigation | authority | status | explicit approval_required |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DECISION-01 | Approve Non-Production as disposable reconstruction target | Non-Production project is the only approved execution target. | Destructive rebuild may affect the approved target. | Require explicit disposable-target acknowledgement and recovery validation. | operator | PENDING | YES |
| DECISION-02 | Accept Auth non-enumerability as governance boundary | Auth enumeration is unavailable in the current authorized channel. | Reconstruction could rely on unknown identity state. | Require synthetic Auth approval and documented governance boundary. | operator | PENDING | YES |
| DECISION-03 | Approve synthetic Auth identities | Current Auth provenance is unknown; synthetic identities are the safe future model. | Synthetic identities may not match downstream assumptions. | Validate against canonical application contracts and RLS requirements. | operator | PENDING | YES |
| DECISION-04 | Approve synthetic application data | Current application data provenance is incomplete or absent. | Synthetic fixtures may not reflect production semantics. | Use only canonical baseline and controlled fixtures; no production copy. | operator | PENDING | YES |
| DECISION-05 | Approve synthetic Storage fixtures | Storage provenance cannot be confirmed. | Synthetic buckets/objects may diverge from business expectations. | Require explicit storage strategy approval and validation. | operator | PENDING | YES |
| DECISION-06 | Approve canonical baseline reconstruction | Canonical Production baseline is the authoritative target. | Drift may occur if the baseline is wrong or incomplete. | Validate against the dependency graph and hash manifest. | operator | PENDING | YES |
| DECISION-07 | Approve exclusion of historical conflicting migrations | Historical migrations conflict with the canonical target. | Blind replay could reintroduce wrong schema. | Exclude historical chain and use canonical baseline only. | operator | PENDING | YES |
| DECISION-08 | Approve RLS reconstruction from canonical baseline | RLS is security-critical and depends on identity semantics. | Weak or inconsistent RLS could expose data. | Validate RLS policies against canonical definitions and application contracts. | operator | PENDING | YES |
| DECISION-09 | Approve rollback/recovery prerequisites | Destructive rebuilds require controlled rollback. | Loss of state or inability to recover. | Require explicit recovery point and manifest validation. | operator | PENDING | YES |
| DECISION-10 | Approve future Option C validated migration model | Only validated canonical reconstruction may proceed to migration strategy. | Premature migration may create drift. | Require canonical validation before migration execution. | operator | PENDING | YES |

## Current state

All decisions remain in PENDING status unless the operator explicitly authorizes them in the current conversation.
