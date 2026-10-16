# PHASE-7.4A Contract Decision

Version: v1.0.0
Status: BLOCKED

## Decision

`CONTRACT_REQUIRES_GOVERNANCE_DECISION`

## Rationale

The application contract is fully identified as a five-argument duplicate-detection operation returning duplicate rows and similarity scores. A historical migration directly defines that contract. The immutable canonical Production contract is fully identified as a three-argument existence check returning boolean. Its body has materially different semantics.

Therefore:

- `APPLICATION_CAN_ADAPT_TO_CANONICAL` is rejected because date proximity, exclusion, region filtering, similarity scoring, and row output would be lost.
- `APPLICATION_CONTRACT_IS_STALE` cannot be proven because historical migration and generated types support the application contract.
- `CANONICAL_SCHEMA_GAP` cannot be proven because the canonical Production baseline is authoritative and contains the three-argument function.
- `UNRESOLVED` is too weak because both identities and semantics are established.
- Governance must decide which materially different contract is authorized before repository migration.

## Required governance decision

Choose and explicitly authorize one of:

1. Preserve the Production three-argument boolean contract and accept changed application behavior through a separately authorized refactor.
2. Approve a new canonical contract through the database governance process; this phase must not create or deploy it.
3. Classify the five-argument application path as stale and remove or disable it in a later refactoring phase.

No option is selected automatically.

## Gate

Call-sites identified: 1 application runtime call-site.

Argument semantics: application 5/5 resolved; canonical 3/3 resolved; cross-contract mapping unresolved.

Historical evidence: FOUND.

Non-production evidence: NOT FOUND / NOT AUTHORIZED.

Source/database/baseline modifications: NONE.

Result: `BLOCKED` until governance establishes the authorized contract.
