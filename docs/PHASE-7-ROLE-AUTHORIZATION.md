# PHASE-7 Role Authorization

SupabaseUserRoleRepository reads public.user_roles by authenticated user ID. Roles are accepted only when they exactly match the verified public.app_role values:

- admin_provinsi
- admin_kab_kota
- panitia
- wasit
- evaluator

AuthContext exposes roles, deterministic primary role, hasRole, hasAnyRole, and hasAllRoles. UI checks are route UX only; RLS and existing database functions remain authoritative for data authorization.

No permission matrix, RBAC table, or membership model was fabricated.

Gate 7.3: PASS.
