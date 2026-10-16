# Phase 8.5D Root Cause Decision

## Decision

`MULTI-LAYER CONTRACT CONFLICT`

## Evidence

- The canonical function identity is `public.check_duplicate_event(text,text,text) RETURNS boolean`.
- Its body references `events.kota_id`.
- The canonical `events` table contains `kabupaten_kota_id uuid` with FK to `public.kabupaten_kota(id)` and no `kota_id`.
- The historical migration and active application caller use a different five-argument, row-returning similarity contract.
- The generated linked Non-Production type confirms the three-argument boolean identity, but cannot prove the semantic meaning of `p_kota_id`.

## Why no narrower decision is justified

`FUNCTION BODY BUG` would require proof that `p_kota_id` means `kabupaten_kota_id`. `FUNCTION CONTRACT BUG` or `SCHEMA SEMANTIC GAP` would require proof that `kota_id` is a distinct required business field. `APPLICATION CONTRACT BUG` would ignore the invalid canonical body and the historical conflict. None is proven by available evidence.

## Gate

`BLOCKED`

Parameter semantics remain ambiguous, and the phase explicitly forbids guessing or mutating while that ambiguity remains.
