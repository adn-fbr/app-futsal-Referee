# PHASE-7.1 Supabase Types Report

## Source and status

| Field | Result |
| --- | --- |
| Type source | src/integrations/supabase/types.ts |
| Generation method | NOT DOCUMENTED in repository |
| Generation timestamp | NOT AVAILABLE |
| Schema version | Canonical baseline SHA-256 b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1 |
| Regenerated | NO |
| Baseline aligned | NO |

## Verified mismatch

The generated enum includes legacy admin and referee values that are absent from the verified public.app_role enum. The generated profiles shape also does not provide a complete baseline-derived contract.

No established local type-generation command or local database was found. Generating directly from the linked Production project would require a Production connection and is not permitted in this remediation. Types were not edited manually, because that would fabricate an incomplete replacement contract.

The Phase 7 auth repositories use only a verified subset of profile fields and independently validate the five verified role values. Full generated type alignment remains blocked until a safe, authorized type-generation input exists.
