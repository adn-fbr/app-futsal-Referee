# PHASE-7.4E-B Codebase Contract Evidence

Version: v1.0.0
Status: PASS - evidence extraction complete

## Scope

Read-only inspection of application source, generated types, historical migration SQL, tests, documentation, and immutable baseline evidence. No implementation decision or source/schema change was made.

## Reconstructed application contract

Observed RPC reference: `supabase.rpc("check_duplicate_event", {...})` in `src/hooks/useEvents.ts:556`.

Inputs are five values: event name, date, optional location, optional kabupaten/kota id, and optional event id to exclude. The observed result is cast to `DuplicateEvent[]`, then wrapped as `{ isDuplicate, duplicates }`.

The duplicate warning is used by `src/pages/EventEdit.tsx` before an event update. It displays the first returned duplicate name and treats an empty array as no warning. If the RPC throws, the current caller catches the error and allows the edit to proceed.

## Evidence confidence

- Call-site and argument expressions: CONFIRMED.
- Input origins and form flow: CONFIRMED.
- Consumed output fields: CONFIRMED.
- Historical similarity scoring: CONFIRMED as historical behavior.
- Current Production rich-search contract: UNKNOWN; canonical baseline conflicts with it.
- Approved algorithm/threshold/security policy: UNKNOWN.

## Similarity and matching

The application contains no `similarity()`, `word_similarity()`, `strict_word_similarity()`, pg_trgm call, configurable threshold, or client-side ranking. Historical SQL uses a fixed CASE score and orders by score then date. This establishes historical behavior only; the current rich-search algorithm is not approved by the codebase.

## Architecture

Current flow is `EventEdit -> useCheckDuplicateEvent -> Supabase RPC`. There is no repository or service boundary for this operation. The generated type describes the five-argument shape, but it does not override the immutable three-argument Production contract.

## Three-way conclusion

Historical migration and current application agree on a five-argument row-returning search. The immutable Production baseline and dependency graph agree on a three-argument boolean existence check. The codebase evidence is complete, but the contract conflict remains a governance decision.
