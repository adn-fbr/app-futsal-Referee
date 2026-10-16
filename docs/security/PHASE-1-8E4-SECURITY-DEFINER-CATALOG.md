# Phase 1.8E.4 SECURITY DEFINER Catalog

## Status

**BLOCKED for executable baseline generation.**

The production reference contains 41 SECURITY DEFINER functions among 47 public functions. Inspected definitions use `search_path = public`; this is not sufficient to establish complete safety or reproducibility.

## Verified high-risk functions

`can_access_region`, `can_approve_registration`, `get_accessible_regions`, `get_admin_dashboard_summary`, `get_audit_logs`, `get_pending_registrations`, `get_registration_history`, `get_user_kabupaten_kota`, `get_user_kabupaten_kota_id`, `has_role`, `is_admin`, `is_admin_kab_kota`, `is_admin_provinsi`, `is_same_region`, `validate_honor_submission`, `validate_referee_assignment`, `validate_regional_access`, and `verify_referee_card` require exact owner/ACL/body extraction.

## Search-path flag

The observed `public` path is fixed but does not explicitly include `pg_temp`. A mutable/unset path cannot be ruled out for every function without the complete `proconfig` catalog. Marked **REVIEW**, not remediated.

## Missing evidence

- Complete function definitions.
- Owners and exact ACLs per signature.
- Caller roles and RPC exposure.
- Referenced tables/functions.
- Identity, role, tenant/region input classification.
- Dynamic SQL review.

No SECURITY DEFINER function was changed.
