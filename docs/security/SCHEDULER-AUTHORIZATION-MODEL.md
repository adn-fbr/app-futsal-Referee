# Scheduler Authorization Model

## Status

BLOCKED pending implementation and non-production deployment.

## Required model

```text
trusted scheduler
  -> server-only secret-backed request authentication
  -> Edge Function request verification
  -> authenticated system principal
  -> operation-specific authorization and tenant/resource checks
  -> service operation
```

## Current repository state

The configured privileged functions use `verify_jwt = true`, but the repository does not yet define a separate, tested scheduler/system invocation contract for scheduled functions such as reminder and license jobs. A valid user JWT alone must not be treated as scheduler identity, and `verify_jwt = false` must not be used as a shortcut.

## Required implementation evidence

For every scheduled function, record the invoker, secret location, replay protection, tenant behavior, service-role use, and operation authorization. Test unauthenticated, forged, replayed, ordinary-user, and valid trusted-scheduler requests against the same non-production project.

Secrets must reside in the Edge Function/deployment secret store and never in `system_settings`, frontend code, client environment variables, or migration SQL.

## Gate impact

Scheduler Authentication remains BLOCKED until the mechanism is implemented, deployed, and runtime-tested.
