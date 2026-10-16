# PRODUCTION RELEASE REPORT v1.0.0

## 1. RESULT

**BLOCKED**

## 2. TARGET

- Production Project ID: `xfscfjwapwnkiinkgbjg`
- Production Project Name: AFP SULSEL
- Region: ap-southeast-2
- Production access in this phase: 0

## 3. RELEASE SUMMARY

- Migrations planned: 0 approved for Production execution
- Migrations applied: 0
- Tables changed: 0
- Functions changed: 0
- Policies changed: 0
- Indexes changed: 0
- Triggers changed: 0
- Data mutations: 0

## 4. SAFETY COUNTERS

- Production DROP SCHEMA: 0
- Production RESET: 0
- Production TRUNCATE: 0
- Production fake data: 0
- Production data DELETE: 0
- Production data UPDATE: 0
- Production fake INSERT: 0
- Service-role exposed: 0
- Frontend secret exposure: 0
- Migration repair: 0
- `--include-all`: 0

## 5. SECURITY

- RLS: FAIL/BLOCKED, remediation not applied or validated
- Authorization: BLOCKED by unresolved regional leakage
- Cross-region isolation: FAIL pre-remediation / not revalidated post-remediation
- Secrets scan: PASS for frontend credential values

## 6. APPLICATION

- TypeScript: PASS
- Tests: PASS, 17 files / 56 tests
- Build: PASS
- Lint: BASELINE FAILURE, 68 errors / 12 warnings
- Smoke tests: local/public evidence only; no Production smoke test

## 7. DRIFT

- Remote Non-Production history contains migrations absent locally, including `20260908085000`, `20260908193235`, and `20260908200857`.
- `20260908085000` is a destructive baseline reconstruction and was not replayed.
- Live Production catalog was not refreshed; offline canonical baseline remains the only Production schema evidence.
- RLS remediation migration exists locally but is not applied/validated.
- Official annual report persistence/QR validation schema does not exist; annual reporting remains preview-only.
- Offline dependency graph contains 47 unresolved and 22 external-managed dependencies.

## 8. ROLLBACK

No Production change occurred, so no rollback is required. No rollback plan authorizes speculative deployment.

## 9. FINAL GATE

**PRODUCTION RELEASE = BLOCKED**

### Blocker
Security and migration state are not deterministically reconciled. Production deployment would violate the release gate.

### Next Safe Action
Restore the authorized SQL channel, remediate and validate Non-Production RLS, resolve migration provenance, define annual report persistence, then refresh the live Production catalog before requesting a new release gate.
