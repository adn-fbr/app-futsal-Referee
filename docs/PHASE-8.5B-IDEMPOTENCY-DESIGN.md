# Phase 8.5B Idempotency Design

## Risks

Double-click, browser retry, timeout after commit, and user retry can create duplicate event requests. The current multi-mutation implementation has no atomic idempotency boundary.

## Required design

The selected transaction function must define a stable idempotency policy before implementation. Candidate mechanisms require governance and schema/contract review:

- reuse an existing canonical uniqueness/business constraint if one covers the exact event identity;
- use a caller-supplied idempotency key only if an existing canonical field/contract supports it;
- otherwise design a new backend idempotency boundary separately.

Do not invent a field or rely solely on client local state. UI submit disablement is necessary but not sufficient. The function must ensure a retry returns/reuses the same committed result or safely reports duplicate, with no second approval.

## Validation

Test normal success, approval failure, timeout/retry, double-click, and post-refresh read. Record event/approval identifiers without secrets. Restore synthetic fixture after tests.

Current status: **DESIGN REQUIREMENT OPEN**; canonical uniqueness/idempotency capability was not established in this design phase.
