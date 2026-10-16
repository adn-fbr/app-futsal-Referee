# Phase 1.8B Runtime Function Inventory

## Status

**PASS for schema-dump function inventory; privilege interpretation is partial.** The runtime dump contains 47 public functions, including 41 `SECURITY DEFINER` declarations.

## Verified SECURITY DEFINER pattern

The dumped definitions set `search_path` to `public` for the inspected SECURITY DEFINER functions. This is stronger than an unset path but does not by itself prove complete safety because `pg_temp` is not explicitly listed and function bodies/EXECUTE grants still require review.

## Verified high-risk examples

- `auto_mark_expired_cards()` is SECURITY DEFINER and performs updates to `referee_cards`.
- `handle_honor_verification()` and `validate_honor_submission()` are SECURITY DEFINER workflow functions.
- `generate_card_number()` and `verify_referee_card()` are exposed card-related functions.
- Regional/reporting functions accept user or region identifiers and require caller-validation review.

## Required function fields

For every public RPC/function record schema, name, argument types, return type, volatility, language, owner, SECURITY INVOKER/DEFINER, effective `search_path`, EXECUTE privileges for `anon`, `authenticated`, `service_role`, `public`, and other roles, RPC exposure, policy references, and trigger references.

For every SECURITY DEFINER function additionally record whether it references `auth.uid()`, accepts user/role/region/resource parameters, and performs or exposes sensitive operations.

## Static priority list

`has_role`, `is_admin`, `is_admin_kab_kota`, `is_admin_provinsi`, `can_access_region`, `is_same_region`, `validate_regional_access`, `get_accessible_regions`, `get_user_kabupaten_kota`, `get_user_kabupaten_kota_id`, `get_referees`, `get_public_referee`, `get_public_referees`, `get_audit_logs`, `get_admin_dashboard_summary`, `get_pending_registrations`, `generate_card_number`, `handle_honor_verification`, `validate_honor_submission`, `validate_referee_assignment`, `soft_delete_record`, `prevent_hard_delete`, `verify_referee_card`, `log_referee_assignment`, `log_registration_approval`, and `log_honor_verification`.

The dump confirms the named priority functions exist where present in the 47-function public inventory. Exact owner, EXECUTE ACL, policy references, trigger references, and caller behavior remain incomplete.

SECURITY DEFINER catalog recovery: **PASS**. Security safety remains **BLOCKED** until exact owner/EXECUTE ACL and caller tests are available.
