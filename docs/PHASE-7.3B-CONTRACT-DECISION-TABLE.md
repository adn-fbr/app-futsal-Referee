# PHASE-7.3B Contract Decision Table

Version: v1.0.0
Status: PASS

| Blocker | Evidence | Canonical Identity | Classification | Resolution | Confidence | Migration Impact |
| --- | --- | --- | --- | --- | --- | --- |
| B-001 `useDiscussions.ts:118` | Source calls RPC with `{ topic_id: id }`; historical migration defines `public.increment_view_count(topic_id uuid) RETURNS void`; absent from immutable baseline, manifest, and dependency graph | `public.increment_view_count(uuid)` | SCHEMA_GAP | Definitively identified as database RPC, but not a canonical baseline object. Do not create it or migrate its call until contract governance decides its disposition | HIGH | HIGH |
| B-002 `useSettings.ts:30` | Source selects `*`; historical migration defines `public.public_system_settings` as `security_invoker` view over `public.system_settings`; generated types expose the view; absent from immutable baseline | `public.public_system_settings` | SCHEMA_GAP | Definitively identified as a view reference, but not canonical baseline evidence. Do not equate it to the table automatically | HIGH | HIGH |
| B-003 `useSettings.ts:45` | Source selects `*`, filters `key`, and uses `maybeSingle`; same view definition and generated-type evidence as B-002 | `public.public_system_settings` | SCHEMA_GAP | Same contract decision as B-002; both call-sites share one missing canonical view reference | HIGH | HIGH |
| B-004 `systemRules.ts:8` | `softDelete(table, id)` parameter is the closed union `profiles | events | honors | event_assignments`; no other callers and no external/user source found | `public.profiles` OR `public.events` OR `public.honors` OR `public.event_assignments` | CANONICAL | Every possible runtime value maps to a baseline table. Resolution is complete as a finite set; repository migration must retain explicit allowlisting | HIGH | CRITICAL |
| B-005 `systemRules.ts:21` | `restoreRecord(table, id)` has the same closed union, caller graph, and baseline mapping as B-004 | `public.profiles` OR `public.events` OR `public.honors` OR `public.event_assignments` | CANONICAL | Every possible runtime value maps to a baseline table. Resolution is complete as a finite set; repository migration must retain explicit allowlisting | HIGH | CRITICAL |

## Decision

All five blockers have an explicit allowed classification. There are no silently unresolved blockers. B-001 through B-003 remain schema gaps and require future contract governance, but the identity and reason are evidence-cleared. B-004 and B-005 are resolved against a closed canonical table set.
