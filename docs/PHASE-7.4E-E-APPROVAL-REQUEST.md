# PHASE-7.4E-E Approval Request

## What

Approve or reject the recommendation to keep the canonical boolean existence check separate from a future rich duplicate-search capability.

## Why

Evidence shows the application requires five inputs and duplicate rows with similarity information, while the canonical Production function is a three-input boolean existence check. Combining them would lose semantics or change the immutable contract.

## Current state

`public.check_duplicate_event(text,text,text) RETURNS boolean` remains canonical and immutable.

## Proposed state

A separately governed rich-search responsibility with exact identity, signature, return type, security, RLS, performance, and migration details decided by the responsible owners.

## Security and RLS

Recommendation: prefer SECURITY INVOKER, respect RLS, do not use service-role browser credentials, and do not invent cross-scope/tenant semantics. Security and Database Owner approval is required.

## Performance

Historical behavior is bounded at five rows and orders score/date. Dataset, latency, timeout, operator, and index decisions require Performance/Product/Database approval. pg_trgm presence alone is not authorization.

## Migration and rollback

Future non-Production implementation, validation, repository migration, Production authorization, catalog re-extraction, and new baseline revision are separate gates. Rollback must preserve the canonical boolean function.

## Approval boundary

Recommendation is not approval. Contract approval is not implementation authorization. Implementation authorization is not Production deployment authorization. Until all 19 decisions are approved, BATCH-01 remains blocked and no code/schema/migration action may occur.
