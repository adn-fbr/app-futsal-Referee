# Phase 1.8D Test Data Safety

## Rules

- Production project is read-only and never a fixture target.
- Never copy `auth.users`, emails, phones, profiles, role rows, storage objects, audit rows, sessions, refresh tokens, JWTs, secrets, or API keys from production.
- Use synthetic values and `SECURITY_TEST_` prefixes.
- Keep test service-role credentials in a secret manager, never in Git, frontend code, tables, logs, or reports.
- Test outputs contain IDs and result classifications only; redact PII and tokens.
- Fixture setup must fail closed unless `TEST_ENVIRONMENT=non-production` and the project ref is not production.
- Cleanup/reset is permitted only for the dedicated test project.

## Bug reproduction

If a production issue requires reproduction, reduce it to a synthetic minimal case using the same schema relationship and non-sensitive values. Do not export or anonymize production records into the test environment.

## Retention

Destroy fixtures after the test run where practical. Retain only schema, test definitions, result classifications, and non-sensitive evidence required for auditability.
