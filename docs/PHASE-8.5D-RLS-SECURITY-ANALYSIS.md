# Phase 8.5D RLS and Security Analysis

The canonical function is `SECURITY DEFINER`, `VOLATILE`, owned by `postgres`, and does not specify a fixed `search_path`. Grants in the canonical source include `anon`, `authenticated`, and `service_role`.

Because the function is `SECURITY DEFINER`, its table read must not be assumed to follow the caller's `events` RLS visibility. A boolean result can disclose that some event matching the supplied exact values exists, including an event the caller may not otherwise be allowed to inspect. The canonical source contains no caller identity, scope, or visibility predicate.

The `events` table has RLS enabled. Its canonical policies allow broad select (`Everyone can view events`) and restrict insertion/update/deletion through admin/panitia predicates. The duplicate function's definer behavior is a separate information-disclosure surface and was not changed.

`kabupaten_kota_id` is the canonical regional FK. No evidence establishes a separate `kota_id` object or scope. Therefore neither RLS behavior nor authorization semantics can safely resolve the parameter mismatch.

No security mode, grants, RLS policy, function, or schema object was modified.
