# PHASE 1.8L — Exact Replacement Function Bodies & Abort-First Migration Draft

Date: 2026-09-24  
Mode: READ-ONLY / DRAFT ONLY  
Production: `xfscfjwapwnkiinkgbjg`

## Gate

**BLOCKED — exact replacement specification prepared, migration NOT APPLIED.**

## 1. Approved browser RPCs

Only these five functions are candidates for direct browser EXECUTE:

1. `public.get_public_referee(uuid)`
2. `public.get_public_referees(text, boolean)`
3. `public.verify_referee_card(text)`
4. `public.get_my_referee_event_count(date, date)`
5. `public.transition_event_assignment_status(uuid, text, text)`

All other SECURITY DEFINER functions remain deny-by-default.

## 2. Rewrite requirements

Every replacement SECURITY DEFINER body must:

- use `SET search_path = ''`;
- schema-qualify all application objects;
- never use `auth.role()`;
- bind caller identity to `auth.uid()` where authentication is required;
- avoid trusting arbitrary user IDs as caller identity;
- expose only the approved result projection;
- preserve exact identity signatures;
- preserve required trigger/business-rule semantics.

## 3. get_my_referee_event_count

Current live body already binds `p.id = auth.uid()`.

Required rewrite:

- retain self-binding;
- require `auth.uid()` not null;
- retain `wasit` role membership;
- schema-qualify `profiles`, `user_roles`, `event_assignments`, `events`;
- preserve date filters;
- use `search_path=''`.

No cross-referee parameter is introduced.

## 4. transition_event_assignment_status

Current live body already contains:

- `auth.uid()` actor resolution;
- actor role checks;
- assignment row lock;
- active assignment check;
- regional restriction for `admin_kab_kota`;
- allowed target statuses;
- cancellation-reason requirement;
- update + return.

Required rewrite:

- preserve all of the above;
- schema-qualify every object;
- replace helper dependency where necessary with an authorization-safe region lookup;
- preserve exact identity signature;
- preserve row locking and concurrency semantics;
- use `search_path=''`.

No weakening of transition rules is permitted.

## 5. Public referee RPCs

`get_public_referee` and `get_public_referees` already use explicit public projections.

Required rewrite:

- preserve only: `id, full_name, profile_photo_url, license_level, afk_origin, kabupaten_kota_name, is_active`;
- preserve approved/profile-complete/non-deleted/wasit filters;
- schema-qualify all objects;
- use `search_path=''`;
- do not add private profile fields.

## 6. verify_referee_card

This function is a special public mutation.

Current live body performs card lookup, validity checks, verification logging, counter update, and JSON response.

### Public response contract

Return only:

- `valid`
- `message`
- `card.card_number`
- `card.issued_at`
- `card.expires_at`
- `card.status`
- `card.referee.full_name`
- `card.referee.profile_photo_url`
- `card.referee.license_level`
- `card.referee.license_expiry`
- `card.referee.afk_origin`
- `card.referee.is_active`
- `card.referee.kabupaten_kota`

Do NOT expose internal card UUID, referee UUID, verification counter, created/updated timestamps, or database implementation details.

### Mutation contract

- blank code => safe invalid response;
- lookup by verification code;
- invalid/revoked/suspended/expired remains invalid;
- verification attempt may remain logged;
- counter update remains bounded to the matched card;
- caller cannot choose an arbitrary UPDATE/INSERT target;
- schema-qualify all objects;
- use `search_path=''`.

### Concurrency requirement

The counter must not rely on a stale read followed by `old_count + 1` when concurrent public verification is possible. The replacement must use an atomic update or equivalent row-locking semantics.

## 7. Deny-by-default ACL

### Anonymous ALLOW
- `get_public_referee`
- `get_public_referees`
- `verify_referee_card`

### Authenticated ALLOW
- `get_my_referee_event_count`
- `transition_event_assignment_status`

### Anonymous DENY / Authenticated DENY
All other SECURITY DEFINER functions.

No blanket `PUBLIC` execute grant is permitted.

## 8. soft_delete_record

`soft_delete_record()` remains unresolved.

Live evidence identifies it as SECURITY DEFINER and trigger-returning, but no proven current application trigger attachment was established. Therefore the migration must not assume trigger-only, delete it, rewrite it blindly, or grant browser EXECUTE.

It remains deny-by-default pending explicit caller/trigger proof.

## 9. Privileged reporting functions

The following remain denied:

- `get_referees`
- `count_referees`
- `get_referee_event_count`
- `get_referee_income_summary`
- `get_admin_dashboard_summary`
- `get_audit_logs`
- `get_honor_statistics`
- `get_pending_registrations`
- `get_registration_history`

Existing internal authorization in some functions is not sufficient evidence for browser EXECUTE.

## 10. Abort-first assertions

Before any ACL/body cutover, verify:

1. expected function signatures exist exactly once;
2. no unexpected duplicate signature exists;
3. required trigger attachments remain enabled;
4. transition signature is unchanged;
5. no canonical rewritten body contains `auth.role(`;
6. canonical rewritten functions use `search_path=''`;
7. only approved public functions have `anon` EXECUTE;
8. only approved authenticated functions have `authenticated` EXECUTE;
9. internal helpers have browser EXECUTE denied;
10. privileged reporting functions have browser EXECUTE denied;
11. notification tables remain internal-only;
12. `system_settings` remains private;
13. `public_application_settings` remains authenticated-read/service-managed;
14. card sequence `2026/737/0040` remains absent;
15. six historical cancellation exceptions remain unchanged;
16. no historical notification backfill occurs;
17. all existing triggers remain enabled;
18. migration is transactional;
19. any failed assertion aborts before commit.

## 11. Implementation restriction

This artifact is a specification/draft, not an executable production migration. No `apply_migration`, DDL, DML, deployment, provider call, or secret read was executed in this phase.

## 12. Gate

**PHASE 1.8L — BLOCKED**

The exact replacement contract is substantially frozen for the five approved browser RPCs, but execution remains blocked until:

- final SQL body text is reviewed as one migration unit;
- `verify_referee_card` atomic counter semantics are frozen;
- `soft_delete_record` receives an explicit disposition;
- static SQL validation is completed;
- the full abort-first assertion set is assembled.

## 13. Next phase

**PHASE 1.8M — Final SQL Assembly, Static Parse & Security Boundary Verification**

Still read-only. No production mutation.

## Safety counters

- Production mutation: 0
- Test mutation: 0
- DDL: 0
- DML: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0
