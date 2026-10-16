# PHASE 4.2.1 — Fixture & Actor Verification

## Status

BLOCKED — WRONG ENVIRONMENT

## Purpose

This phase is limited to verification only. It must not create fixtures, seed actors, mutate application data, touch production, or print secrets. The gate is intentionally fail-closed: if the runtime is bound to the wrong project or the required fixture contract is absent, the phase stops before any deeper RPC or RLS validation.

## Guardrails

- Target project for this phase: `shorsqyycpptxcutrqrb`
- Production project: `xfscfjwapwnkiinkgbjg` — explicitly forbidden
- No fixture creation, no Auth mutation, no seed execution, no production access
- No secrets or service-role values may be exposed
- If required actors or fixtures are missing, status is `BLOCKED — FIXTURE/ACTOR PREREQUISITE MISSING`
- If runtime/environment is wrong, status is `BLOCKED — WRONG ENVIRONMENT`

## Required Verification Inputs

The repository contract for fixture provisioning requires all of the following before any test fixture can be considered usable:

- `TEST_ENVIRONMENT=non-production`
- exact authorized Supabase URL/project ref for the test project
- `SUPABASE_SERVICE_ROLE_KEY`
- `FIXTURE_ADMIN_PASSWORD`
- approved synthetic actor IDs and deterministic fixture names

This is documented in [supabase/tests/fixtureProvisioningGuard.ts](supabase/tests/fixtureProvisioningGuard.ts) and [docs/PHASE-4.1-TEST-FIXTURE-DESIGN.md](docs/PHASE-4.1-TEST-FIXTURE-DESIGN.md).

## Environment Check

### Runtime evidence

The active app environment is not aligned with the authorized test project:

- `.env` contains `VITE_RUNTIME_MODE="production"`
- `.env` contains `VITE_SUPABASE_PROJECT_ID="xfscfjwapwnkiinkgbjg"`
- `.env` contains `VITE_SUPABASE_URL="https://xfscfjwapwnkiinkgbjg.supabase.co"`

This is the production project reference, not the approved test project `shorsqyycpptxcutrqrb`.

### Required comparison

| Required target | Observed runtime | Result |
|---|---|---|
| `shorsqyycpptxcutrqrb` | `xfscfjwapwnkiinkgbjg` | MISMATCH |
| `TEST_ENVIRONMENT=non-production` | production runtime mode | MISMATCH |
| authorized non-production project | production project | BLOCKED |

## Actor and Fixture Readiness

The following required synthetic identities and objects were not verifiable in the active runtime because the environment is already wrong and the provisioning prerequisites are unavailable:

- `PROVINCE_ADMIN`
- `KABKOTA_ADMIN_A`
- `KABKOTA_ADMIN_B`
- `AUTHENTICATED_NON_ADMIN`
- `REFEREE_A`
- `REFEREE_B`
- `NON_REFEREE_TARGET`
- `LICENSE_A`
- `KTP_A`
- `LICENSE_B`
- `KTP_B`

The repository documents these as test-only fixtures and explicitly states they must not be created or inferred without the proper non-production environment and authorization. No fixture creation was attempted in this session.

## Verification Result

### Final gate

`BLOCKED — WRONG ENVIRONMENT`

### Why it is blocked

1. The application runtime is bound to the production project `xfscfjwapwnkiinkgbjg` instead of the authorized test project `shorsqyycpptxcutrqrb`.
2. The runtime mode is production, which fails the `TEST_ENVIRONMENT=non-production` requirement.
3. The required provisioning variables for fixture creation are not established in the current secure runtime.
4. The repository explicitly requires fail-closed behavior when the environment or fixture contract is not satisfied.

## Outcome

No validation, fixture creation, or mutation was performed. Phase 4.2 must not continue until a valid test environment and approved fixture contract are in place.
