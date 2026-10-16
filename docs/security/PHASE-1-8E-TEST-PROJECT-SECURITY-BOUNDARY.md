# Phase 1.8E Test Project Security Boundary

## Boundary

Production `xfscfjwapwnkiinkgbjg` is a read-only schema/reference source. The security test project must have a distinct ref, URL, database, Auth tenant, storage, Edge Functions, secrets, API keys, JWT signing configuration, and external integration configuration.

## Forbidden sharing

Do not share production database, Auth users, JWT secret, service-role key, anon/publishable key, storage, SMTP, webhook, OAuth, Resend, or other external integration credentials.

## Test integrations

External email/webhook/OAuth integrations must be disabled, mocked, or use dedicated test credentials. No production delivery or callback endpoint may be reachable from the test project.

## Access

- Browser tests use test anon/publishable key only.
- Fixture setup uses test service role only in protected server/CI context.
- Production ref and URL are deny-listed in all test scripts.
- Production credentials are absent from test secrets.
- A target preflight runs before every Supabase operation.

## Lifecycle

The test project is disposable and may be reset/destroyed only after confirming its ref is not production. Production remains outside all deployment and cleanup workflows.
