# PHASE-7.3B RPC Resolution

Version: v1.0.0
Status: PASS

## Result

The 25th unresolved RPC from Phase 7.3A is `src/hooks/useDiscussions.ts:118`, calling `increment_view_count` with `{ topic_id: id }`. The historical migration defines the exact contract `public.increment_view_count(topic_id uuid) RETURNS void`, `SECURITY DEFINER`, with an update to `public.discussion_topics`. It is absent from the immutable canonical baseline and dependency graph.

Classification: `SCHEMA_GAP`. The identity is established; the canonical contract is not present. This is evidence-cleared under the Phase 7.3B gate, but it is not authorization to create or deploy the function.

## RPC inventory

| Canonical identity | Return type | Callers | Status |
| --- | --- | --- | --- |
| `public.get_audit_logs(text,uuid,text,uuid,timestamptz,timestamptz,integer,integer)` | TABLE | `useAuditLogs.ts:45` | CANONICAL_FUNCTION |
| `public.get_referees(text,boolean,uuid,text,integer,integer)` | TABLE | `useEventAssignments.ts:178`, `useReferees.ts:42,85,205`, `useSmartAssignment.ts:65` | CANONICAL_FUNCTION |
| `public.check_duplicate_event(text,text,text)` | boolean | `useEvents.ts:556` | CANONICAL_FUNCTION |
| `public.get_public_referees(text,boolean)` | TABLE | `usePublicReviews.ts:28,172` | CANONICAL_FUNCTION |
| `public.get_public_referee(uuid)` | TABLE | `usePublicReviews.ts:84` | CANONICAL_FUNCTION |
| `public.search_referee_cards(text,text,integer,integer)` | TABLE | `useRefereeCard.ts:102` | CANONICAL_FUNCTION; exact overload |
| `public.count_referee_cards(text,text)` | bigint | `useRefereeCard.ts:148` | CANONICAL_FUNCTION |
| `public.generate_card_number(uuid)` | varchar | `useRefereeCard.ts:251,449,513` | CANONICAL_FUNCTION |
| `public.verify_referee_card(text)` | jsonb | `useRefereeCard.ts:368` | CANONICAL_FUNCTION |
| `public.count_referees(text,boolean,uuid,text)` | bigint | `useReferees.ts:109` | CANONICAL_FUNCTION |
| `public.get_pending_registrations()` | TABLE | `useRegistrations.ts:36,60` | CANONICAL_FUNCTION |
| `public.get_registration_history()` | TABLE | `useRegistrations.ts:48` | CANONICAL_FUNCTION |
| `public.get_admin_dashboard_summary(uuid,date,date)` | TABLE | `useReports.ts:48` | CANONICAL_FUNCTION |
| `public.get_referee_income_summary(uuid,date,date)` | TABLE | `useReports.ts:68` | CANONICAL_FUNCTION |
| `public.get_referee_event_count(uuid,date,date)` | TABLE | `useReports.ts:85` | CANONICAL_FUNCTION |
| `public.can_access_region(uuid,uuid)` | boolean | `systemRules.ts:35` | CANONICAL_FUNCTION |
| `public.increment_view_count(uuid)` | void | `useDiscussions.ts:118` | SCHEMA_GAP |

All 25 RPC operation records map to one of these identities. The two `search_referee_cards` overloads remain distinct; the application call uses the `(text,text,integer,integer)` overload. No function signature was fabricated.
