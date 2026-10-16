# PHASE-7.3A Contract Matrix

Version: v1.0.0
Status: BLOCKED

## Row-level traceability

The authoritative row set is `docs/PHASE-7.3-BUSINESS-SUPABASE-ACCESS-INVENTORY.json`, `operations[0..269]`. Each row is a 12-field normalized tuple in this order:

`file | line | operation | supabaseApi | object | readWrite | host | classification | repositoryStatus | risk | migrationBatch | databaseContract`

Thus all 270 operations are traceable by `(file, line)` and retain their original operation, target, read/write mode, domain, repository disposition, risk, batch, and baseline status. No row was inferred or removed.

## Contract matrix summary

| Application target / operation set | Operation count | Canonical database identity rule | Baseline status | Ownership | External-managed | Repository destination | Security consideration | Risk | Resolution |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| Public application tables and views | 220 | `public.<relation>` | VERIFIED_PRODUCTION_OBJECT | Application | No | Domain repository grouped by batch | RLS and role/region predicates | P0-P3 per JSON row | TRACEABLE |
| RPC calls except `increment_view_count` | 24 | `public.<function>(identity argument types)` | VERIFIED_PRODUCTION_OBJECT | Application database contract | No | Domain repository RPC adapter | Function grants, auth context, SECURITY DEFINER review | P1-P2 | RESOLVED_CANONICAL |
| `increment_view_count` RPC | 1 | `public.increment_view_count(uuid)` | NOT_FOUND_IN_BASELINE | Unresolved contract | No | Discussion repository after contract decision | Must not be exposed through an unverified contract | P2 | BLOCKED_SCHEMA_GAP |
| `public_system_settings` reads | 2 | `public.public_system_settings` | NOT_FOUND_IN_BASELINE | Unresolved contract | No | Settings repository after contract decision | Read policy and view security posture | P3 | BLOCKED_SCHEMA_GAP |
| Dynamic `systemRules.ts` updates | 2 | One of four explicit public tables, not determinable per record | AMBIGUOUS | Application | No | Explicit System Rules repository methods | Allowlist each table and enforce role/region RLS | P2 | BLOCKED_AMBIGUOUS_REFERENCE |
| Auth API calls | 26 | Supabase Auth API method, not public table identity | EXTERNAL_MANAGED | AUTH_MANAGED | Yes | Existing Auth repository extension | Session lifecycle and user identity authority | P0 | RESOLVED_EXTERNAL_MANAGED |
| Storage operations | 15 | `storage:<bucket>` plus object path where available | EXTERNAL_MANAGED | SUPABASE_MANAGED | Yes | Profile/Document storage adapter | Bucket policy, signed URL scope, no service key in browser | P3 | RESOLVED_EXTERNAL_MANAGED |
| Edge Function invocations | 18 | `function:<name>` | EXTERNAL_MANAGED | SUPABASE_MANAGED | Yes | Domain application service adapter | JWT verification and handler authorization | P0-P3 | RESOLVED_EXTERNAL_MANAGED |
| Realtime operations | 4 | `realtime:<channel>` | EXTERNAL_MANAGED | SUPABASE_MANAGED | Yes | Notification/Discussion realtime adapter | Channel filters and authenticated subscription | P3 | RESOLVED_EXTERNAL_MANAGED |

The summary counts overlap by contract family only where explicitly stated; the JSON operation array remains the sole record-level source of truth and totals exactly 270.

## RPC contract matrix

| Function identity | Return type from baseline | Callers | Resolution |
| --- | --- | --- | --- |
| `public.get_audit_logs(text,uuid,text,uuid,timestamptz,timestamptz,integer,integer)` | `TABLE` | `useAuditLogs.ts:45` | RESOLVED_CANONICAL |
| `public.get_referees(text,boolean,uuid,text,integer,integer)` | `TABLE` | `useEventAssignments.ts:178`, `useReferees.ts:42,85,205`, `useSmartAssignment.ts:65` | RESOLVED_CANONICAL |
| `public.check_duplicate_event(text,text,text)` | `boolean` | `useEvents.ts:556` | RESOLVED_CANONICAL |
| `public.get_public_referees(text,boolean)` | `TABLE` | `usePublicReviews.ts:28,172` | RESOLVED_CANONICAL |
| `public.get_public_referee(uuid)` | `TABLE` | `usePublicReviews.ts:84` | RESOLVED_CANONICAL |
| `public.search_referee_cards(text,text,integer,integer)` | `TABLE` | `useRefereeCard.ts:102` | RESOLVED_CANONICAL; exact overload |
| `public.count_referee_cards(text,text)` | `bigint` | `useRefereeCard.ts:148` | RESOLVED_CANONICAL |
| `public.generate_card_number(uuid)` | `varchar` | `useRefereeCard.ts:251,449,513` | RESOLVED_CANONICAL |
| `public.verify_referee_card(text)` | `jsonb` | `useRefereeCard.ts:368` | RESOLVED_CANONICAL |
| `public.count_referees(text,boolean,uuid,text)` | `bigint` | `useReferees.ts:109` | RESOLVED_CANONICAL |
| `public.get_pending_registrations()` | `TABLE` | `useRegistrations.ts:36,60` | RESOLVED_CANONICAL |
| `public.get_registration_history()` | `TABLE` | `useRegistrations.ts:48` | RESOLVED_CANONICAL |
| `public.get_admin_dashboard_summary(uuid,date,date)` | `TABLE` | `useReports.ts:48` | RESOLVED_CANONICAL |
| `public.get_referee_income_summary(uuid,date,date)` | `TABLE` | `useReports.ts:68` | RESOLVED_CANONICAL |
| `public.get_referee_event_count(uuid,date,date)` | `TABLE` | `useReports.ts:85` | RESOLVED_CANONICAL |
| `public.can_access_region(uuid,uuid)` | `boolean` | `systemRules.ts:35` | RESOLVED_CANONICAL |
| `public.increment_view_count(uuid)` | unknown from canonical baseline | `useDiscussions.ts:118` | BLOCKED_SCHEMA_GAP |

The 24 resolved RPC operations use these 15 canonical function identities plus repeated call-sites. The two overloaded `search_referee_cards` identities are preserved; the application call-site at line 102 is mapped to the `(text,text,integer,integer)` overload from its argument names.

## Ownership classification

External references are classified as `AUTH_MANAGED` for Auth methods, `SUPABASE_MANAGED` for Storage/Realtime/Edge Functions, and no application operation is classified as `EXTENSION_MANAGED` or `OTHER_EXTERNAL` in the 270-row inventory. `auth.users` is not queried directly.
