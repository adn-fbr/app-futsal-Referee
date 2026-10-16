# Phase 8.5E RLS Security Analysis

The canonical function is `SECURITY DEFINER`, `VOLATILE`, owned by `postgres`, and has no fixed `search_path` in its definition. Canonical grants include `anon`, `authenticated`, and `service_role`.

A SECURITY DEFINER function executes with owner privileges; absent a FORCE-RLS finding, its read must not be assumed to be restricted by the caller's `events` policies. Therefore `true` can disclose existence of a matching event even when the caller cannot select that row. The canonical function has no `auth.uid()` or scope predicate.

The `events` table has RLS enabled with broad select and admin/panitia mutation policies. `kabupaten_kota` is broadly selectable. Admin Provinsi is represented by `is_admin_provinsi(auth.uid())` and has broad regional-management policies, but that does not establish the meaning of `p_kota_id`.

SECURITY INVOKER would preserve caller RLS only if the intended duplicate semantics are caller-visible data and the existing policies permit the required read. Whether that is the business requirement is unresolved. If DEFINER remains necessary, a fixed `search_path`, explicit authorization/visibility decision, and disclosure review are required.

No security, grants, RLS, function, or database object was modified.
