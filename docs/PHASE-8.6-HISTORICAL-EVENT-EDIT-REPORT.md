# PHASE 8.6
# ADMIN PROVINSI HISTORICAL EVENT EDITING

## STATUS

**PARTIAL — HISTORICAL EVENT EDIT IMPLEMENTED, LIVE VALIDATION INCOMPLETE**

## TARGET

- Non-Production: `shorsqyycpptxcutrqrb`
- Production: `xfscfjwapwnkiinkgbjg`
- Production access: 0

## IMPLEMENTATION

- Historical status is derived from canonical `events.start_date` compared with the application's existing local `startOfDay(new Date())` convention.
- Historical route access requires `admin_provinsi`; non-admin users receive a generic denial message.
- Historical editing displays a `HISTORICAL EVENT` indicator and permits past dates in the existing date controls.
- Historical save opens a password step-up dialog with masked input, show/hide control, cancellation, disabled duplicate submission, and error state.
- The mutation independently checks `user_roles`, re-fetches the event, re-checks its historical date, and verifies the current user's Supabase Auth password with `signInWithPassword` before updating.
- Password is not persisted, logged, sent to application tables, or included in audit payloads.
- Existing duplicate RPC is preserved. Self-edit with unchanged duplicate fields is excluded locally because the canonical RPC has no event-id exclusion argument.
- Existing query invalidation refreshes event list/detail state after save.

## AUDIT

The existing `audit_logs` mechanism is used for historical opened, step-up requested/success/failed, authorization denied, update failed, and updated events. Successful update audit includes actor, event, changed fields, and before/after data. Live database read-back is unavailable.

Known limitation: the current architecture uses direct publishable-client update plus audit insert and has no approved transaction/RPC for atomic update-plus-audit. The implementation fails before update when step-up success audit fails; post-update audit failure cannot rollback the already committed update and remains a live validation/governance gap.

## SECURITY / RLS

No schema, migration, RLS, RPC, or service-role frontend change was made. Existing RLS remains the database boundary. Live Admin/non-Admin mutation and audit validation is blocked because Phase 8.5G.3B has no synthetic Auth fixture.

## REGRESSION

- TypeScript: PASS
- Tests: PASS, 12 files and 38 tests
- Build: PASS, with existing large chunk and stale Browserslist warnings
- Lint: repository baseline remains failing; unrelated lint remediation was not performed

## FINAL GATE

**PARTIAL — HISTORICAL EVENT EDIT IMPLEMENTED, LIVE VALIDATION INCOMPLETE**

Live validation requires completion of the Non-Production synthetic Auth/fixture provisioning phases before Admin, non-admin, RLS, audit read-back, wrong-password, and browser workflows can be proven.
