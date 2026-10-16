-- PHASE 1.3 — MIGRATION SQL DRAFT
-- AFP SULSEL / Production
-- STATUS: DRAFT ONLY — DO NOT APPLY
-- Purpose: authorization/search_path/RLS boundary remediation design.
-- This file intentionally contains no migration-history application command.
-- Preconditions must be satisfied by Phase 1.4 static validation and Phase 1.5 completion.

BEGIN;

-- ================================================================
-- 0. PRE-FLIGHT ASSERTIONS (DESIGN PLACEHOLDERS)
-- ================================================================
-- Abort if canonical objects/signatures are absent or unexpected.
-- Exact assertions should be finalized after Phase 1.5 schema/business-rule completion.

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'transition_event_assignment_status'
    AND pg_get_function_identity_arguments(p.oid) = 'p_assignment_id uuid, p_target_status text, p_reason text';

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'PRE-FLIGHT FAILED: transition_event_assignment_status signature mismatch';
  END IF;
END $$;

-- ================================================================
-- 1. EXECUTE BOUNDARY — REMOVE PUBLIC EXECUTE FROM SECURITY DEFINER API
-- ================================================================
-- PostgreSQL grants EXECUTE to PUBLIC by default. Revoke first, then
-- explicitly grant only the intended caller classes.

-- Public verification/search endpoints — retain anon only after contract tests.
REVOKE EXECUTE ON FUNCTION public.get_public_referee(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_referees(text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_referee_card(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_referee(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_referees(text, boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_referee_card(text) TO anon;

-- Authenticated application RPCs — exact allowlist to be finalized against caller inventory.
REVOKE EXECUTE ON FUNCTION public.get_referees(text, boolean, uuid, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_referee_event_count(uuid, date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_referee_income_summary(uuid, date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_referee_event_count(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_schedule_conflict(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.transition_event_assignment_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referees(text, boolean, uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referee_event_count(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referee_income_summary(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_referee_event_count(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_schedule_conflict(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_event_assignment_status(uuid, text, text) TO authenticated;

-- Admin/operational RPCs: do not grant until caller/role contract is finalized.
-- Candidate examples: get_admin_dashboard_summary, get_audit_logs,
-- get_pending_registrations, get_registration_history, count_referees,
-- get_honor_statistics.
-- These remain intentionally UNGRANTED in this draft.

-- Internal authorization helpers: no direct browser RPC.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_kab_kota(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_provinsi(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_region(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_same_region(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_kabupaten_kota(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_kabupaten_kota_id(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_regional_access() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_accessible_regions(uuid) FROM PUBLIC;

-- Internal/trigger functions: no direct browser RPC.
-- Trigger execution itself must remain attached and enabled.
REVOKE EXECUTE ON FUNCTION public.auto_mark_expired_cards() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_referee_assignment_update_scope() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_honor_verification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_honor_verification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_referee_assignment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_registration_approval() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_hard_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.soft_delete_record() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_card_expiry() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_topic_reply_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_honor_submission() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_referee_assignment() FROM PUBLIC;

-- Privileged/internal card generation: no direct browser RPC.
REVOKE EXECUTE ON FUNCTION public.generate_card_number(uuid) FROM PUBLIC;

-- ================================================================
-- 2. SECURITY DEFINER SEARCH_PATH HARDENING — NOT AUTO-GENERATED HERE
-- ================================================================
-- REQUIRED PATTERN:
--   SET search_path = ''
-- and schema-qualify every relation/function/type referenced by the body.
--
-- This draft intentionally does NOT issue CREATE OR REPLACE for all 42+
-- SECURITY DEFINER functions because exact return types, volatility,
-- defaults, dependency order, and callers must be frozen first.
--
-- Phase 1.4 must reject any function whose hardened body still contains
-- unqualified application objects or unresolved references.

-- ================================================================
-- 3. PRIVATE SYSTEM SETTINGS BOUNDARY
-- ================================================================
-- DO NOT recreate browser access to public.system_settings.
-- Public configuration must remain behind public_application_settings.
-- The write path remains the authenticated server-side Edge Function.
--
-- Any policy/GRANT change to system_settings requires a separate explicit
-- contract and is intentionally omitted from this draft.

-- ================================================================
-- 4. RLS POLICY REMEDIATION — DESIGN ONLY
-- ================================================================
-- Four current RLS-enabled/no-policy tables require explicit private policy
-- contracts before execution:
--   activity_logs, auth_attempts, event_logs, system_settings
--
-- Do NOT add permissive policies merely to make application queries work.
-- Prefer explicit TO authenticated / TO anon targets and least-privilege
-- predicates.

-- ================================================================
-- 5. HIGH-RISK PUBLIC POLICY REVIEW — NO BLIND DROP/RECREATE
-- ================================================================
-- event_approvals: "Everyone can view event approvals" must be resolved
-- against the actual public UX contract before changing.
-- referee_reviews: anonymous INSERT/SELECT requires anti-abuse and field
-- ownership/business-rule validation before narrowing or preserving.
-- profiles/events: public row visibility requires projection/field review.
--
-- These are intentionally not changed in this draft.

-- ================================================================
-- 6. TRIGGER PRESERVATION ASSERTION
-- ================================================================
DO $$
DECLARE
  v_disabled integer;
BEGIN
  SELECT count(*) INTO v_disabled
  FROM pg_trigger t
  JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND NOT t.tgisinternal
    AND t.tgenabled <> 'O';

  IF v_disabled <> 0 THEN
    RAISE EXCEPTION 'PRE-FLIGHT FAILED: disabled user-defined public triggers detected: %', v_disabled;
  END IF;
END $$;

-- ================================================================
-- 7. ROLLBACK DESIGN
-- ================================================================
-- If this migration is later applied, rollback MUST restore the exact
-- pre-migration EXECUTE grants captured in the Phase 1.4 snapshot.
-- Do not use blanket GRANT EXECUTE ON ALL FUNCTIONS; that would erase the
-- intended security boundary.
--
-- Example rollback pattern (NOT TO BE EXECUTED until exact snapshot exists):
--   GRANT EXECUTE ON FUNCTION public.<exact_signature>() TO PUBLIC;
--   -- restore any explicit anon/authenticated grants from snapshot.

COMMIT;
