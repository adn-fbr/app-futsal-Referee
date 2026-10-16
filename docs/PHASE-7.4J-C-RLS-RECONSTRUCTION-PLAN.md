# PHASE 7.4J-C RLS Reconstruction Plan

Status: **BLOCKED / EVIDENCE REQUIRED**

Reconstruction must verify, per table, RLS enabled state and SELECT/INSERT/UPDATE/DELETE policies, role targets, `auth.uid()` behavior, profile/role dependencies, and event visibility.

The offline baseline shows 86 policies and events RLS enabled. Runtime policy state is not independently verified. No permissive policy, SECURITY DEFINER function, or RLS bypass may be used.

RLS verification precedes type regeneration and Phase 7.4J re-entry.
