# Phase 1.8E Secrets Boundary

## Production rule

No production secret is copied, displayed, logged, committed, or used by the test project.

## Test secret inventory

Only provision values actually required by the test deployment, through a secret manager:

- test `SUPABASE_URL`;
- test `SUPABASE_ANON_KEY` or publishable key;
- test `SUPABASE_SERVICE_ROLE_KEY`, server/fixture setup only;
- test Edge Function scheduler/email secrets, if those functions are tested;
- mock/disabled external integration credentials where required.

## Prohibited locations

Service-role keys and secrets must never appear in frontend code, `VITE_*` variables, public assets, README/docs, migrations, tables, localStorage, sessionStorage, logs, test output, or Git.

## Controls

Test jobs validate URL/ref against the production deny-list. Browser tests receive only the test publishable/anon key. CI masks all secret values. Fixture scripts fail closed when environment markers or target identity are missing.
