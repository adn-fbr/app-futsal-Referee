# Baseline Security Risk Register

## Status

BLOCKED. Canonical baseline generation is not permitted until the verified live production catalog is available.

## Risk categories retained for later reproduction

- `SECURITY DEFINER` functions
- `search_path` variability
- broad EXECUTE grants
- `USING (true)` and `WITH CHECK (true)`
- anonymous/authenticated function EXECUTE privileges
- ownership mismatches between production and isolated test roles
- runtime function drift and compatibility differences

## Gating rule

These items must be reproduced exactly from the live production catalog, not hardened or rewritten during this phase.
