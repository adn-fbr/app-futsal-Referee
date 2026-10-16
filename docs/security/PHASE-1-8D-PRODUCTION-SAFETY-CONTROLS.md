# Phase 1.8D Production Safety Controls

## Production deny-list

Production ref: `xfscfjwapwnkiinkgbjg`.

Every fixture, test, migration, seed, reset, and deployment command must preflight-reject this ref and production URL. The production project must not be present in test-job secrets.

## Operational controls

1. Separate Supabase project and credentials.
2. Separate CI secret namespace and service account.
3. Protected environment requiring explicit approval for test deployment.
4. Schema-only reference export; no production data export.
5. No production service-role key in local/CI test environments.
6. Test client uses only test anon/publishable key.
7. Fixture script requires non-production environment marker.
8. Destructive cleanup commands require test project identity confirmation.
9. Logs redact tokens, passwords, PII, and secret values.
10. Production remains catalog/reference-only.

## Review gate

Before any test execution, two people or an equivalent protected workflow must verify the target URL/ref, environment label, and fixture secret namespace. A mismatch blocks execution.

## Forbidden actions

No production DML, DDL, migration, reset, seed, fixture creation, Auth change, role change, policy change, grant/revoke, function change, trigger change, or behavioral security probe.
