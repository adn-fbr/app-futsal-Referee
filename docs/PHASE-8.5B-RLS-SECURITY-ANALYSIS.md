# Phase 8.5B RLS and Security Analysis

## Existing evidence

Canonical schema has policies for event creation, approval insertion, event updates, and assignment status. `event_approvals` has an `AFTER INSERT` audit trigger. Existing Edge Function authorization resolves bearer user, `user_roles`, and profile scope.

## Design requirements

- Prefer invoker function so `events` and `event_approvals` RLS applies normally.
- Explicitly verify `auth.uid()` is authenticated and has `admin_provinsi` through `user_roles`.
- Enforce province scope using canonical profile/role model; do not infer from password or metadata.
- Do not use SECURITY DEFINER as an RLS bypass. If governance later requires it, review owner, fixed `search_path`, explicit role check, scope check, and abuse cases separately.
- Keep browser on publishable key; never expose service-role.
- Test Admin Provinsi allow, non-admin deny, anonymous deny, and cross-scope denial in Non-Production.

## RLS classification

Current design status: `RLS UNCERTAIN FOR NEW TRANSACTION FUNCTION`; existing RLS was not changed or remotely tested. No claim of runtime alignment is made until implementation and fixture tests exist.
