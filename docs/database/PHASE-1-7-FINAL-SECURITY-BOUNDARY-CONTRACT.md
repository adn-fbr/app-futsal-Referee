# PHASE 1.7 — FINAL SECURITY BOUNDARY CONTRACT

## 1. Executive Decision

Production security boundary saat ini BELUM boleh dimutasi.

Kontrak boundary telah dapat dibekukan secara desain untuk:

- privileged database functions;
- browser-direct RPC;
- internal trigger functions;
- Edge Function boundaries;
- provider webhook boundaries;
- canonical notification tables;
- referee contact access;
- public application settings;
- system/internal tables;
- SECURITY DEFINER hardening;
- EXECUTE ACL;
- RLS.

### Gate

**PHASE 1.7 — BLOCKED / CONTRACT FROZEN FOR ASSEMBLY**

Blocked bukan karena desain boundary tidak tersedia, tetapi karena implementasi final masih harus:

1. dirakit menjadi migration;
2. diverifikasi secara statis;
3. diuji di Test;
4. dibandingkan dengan baseline Production;
5. baru kemudian dipertimbangkan untuk Production.

---

# 2. Security Boundary Model

Arsitektur final:

```text
Browser
  |
  +-- Public anonymous RPC
  |      |
  |      +-- strictly public-safe functions only
  |
  +-- Authenticated RPC
  |      |
  |      +-- explicitly allowlisted application RPCs
  |
  +-- Edge Function
  |      |
  |      +-- JWT verification
  |      +-- resolveCaller()
  |      +-- role authorization
  |      +-- region/scope authorization
  |      +-- service-role DB client
  |
  +-- Provider Webhook
         |
         +-- JWT disabled intentionally
         +-- provider-specific authentication
         +-- payload validation
         +-- idempotent persistence

Database internal layer
  |
  +-- SECURITY DEFINER
  +-- trigger functions
  +-- internal helper functions
  +-- no direct browser EXECUTE
```

Prinsip utama:

> `SECURITY DEFINER` bukan public API.

Setiap SECURITY DEFINER function harus memiliki salah satu dari tiga status:

1. explicitly public-safe;
2. explicitly authenticated application RPC;
3. internal-only.

Tidak boleh ada implicit `PUBLIC EXECUTE`.

---

# 3. Current Production Finding

Production saat ini memiliki 42 SECURITY DEFINER functions dan seluruh fungsi yang diaudit masih memiliki:

```text
anon          EXECUTE = true
authenticated EXECUTE = true
```

Sebagian besar juga masih:

```text
SET search_path = public
```

Ini merupakan kondisi pre-remediation dan menjadi target utama Phase 1.8.

---

# 4. EXECUTE Boundary Contract

## 4.1 Anonymous/Public RPC

Hanya tiga function yang dapat dipertahankan sebagai anonymous RPC candidate:

### A. get_public_referee(uuid)

Allowed:

```text
anon          ALLOW
authenticated ALLOW
```

Contract:

- read-only;
- hanya referee yang approved;
- profile complete;
- non-deleted;
- role `wasit`;
- output hanya public-safe fields.

Output saat ini:

- id
- full_name
- profile_photo_url
- license_level
- afk_origin
- kabupaten_kota_name
- is_active

Tidak boleh diperluas tanpa review public-data contract.

---

### B. get_public_referees(text, boolean)

Allowed:

```text
anon          ALLOW
authenticated ALLOW
```

Contract sama dengan `get_public_referee`.

Search/filter tidak boleh membuka kolom private.

---

### C. verify_referee_card(text)

Allowed:

```text
anon          ALLOW
authenticated ALLOW
```

Tetapi function ini adalah **special public mutating RPC**.

Function:

- membaca kartu;
- mencatat verification attempt;
- mengubah verification counter;
- mengubah `last_verified_at`.

Karena itu harus diperlakukan sebagai controlled public API, bukan sekadar SELECT helper.

Contract wajib:

- input code tervalidasi;
- output public-safe;
- tidak mengungkap private profile fields;
- tidak membuka arbitrary card lookup;
- verification logging tetap berjalan;
- mutation hanya pada card terkait;
- search_path hardened;
- rate-limiting/abuse protection tetap menjadi application/provider concern bila diperlukan.

---

# 5. Authenticated Browser RPC

Authenticated browser RPC hanya boleh mencakup function yang memang merupakan application contract.

### Approved candidates

```text
get_referees(...)
get_referee_event_count(...)
get_referee_income_summary(...)
get_my_referee_event_count(...)
has_schedule_conflict(...)
transition_event_assignment_status(...)
```

Target:

```text
anon          DENY
authenticated ALLOW
```

Tetapi `authenticated` tidak berarti automatically authorized.

Setiap function wajib mempunyai authorization contract sendiri.

---

# 6. transition_event_assignment_status

Contract:

```text
anon          DENY
authenticated ALLOW
```

Authorization wajib tetap dilakukan di dalam function.

Current verified controls:

- `auth.uid()` wajib tersedia;
- assignment harus ada;
- assignment harus aktif;
- actor harus memiliki role yang sesuai;
- `admin_provinsi` dapat mengelola;
- `admin_kab_kota` dibatasi region;
- `panitia` dapat mengelola sesuai existing contract;
- target status harus:

- pending
- confirmed
- declined
- cancelled
- cancellation membutuhkan reason;
- row dikunci `FOR UPDATE`;
- cross-region access ditolak.

Legacy exception:

```text
6 historical cancelled assignments
tanpa cancellation_reason
```

 tidak boleh dipaksa melalui CHECK baru.

---

# 7. Internal Authorization Helpers

Functions:

```text
has_role(...)
is_admin(...)
is_admin_kab_kota(...)
is_admin_provinsi(...)
is_same_region(...)
can_access_region(...)
get_user_kabupaten_kota(...)
get_user_kabupaten_kota_id(...)
validate_regional_access(...)
```

Target:

```text
anon          DENY
authenticated DENY
```

unless a later caller audit proves an explicit browser RPC requirement.

Rationale:

Parameter seperti:

```text
_user_id
```

 tidak boleh menjadikan helper sebagai arbitrary identity oracle.

Internal authorization helpers harus dipanggil:

- oleh SECURITY DEFINER functions;
- oleh database policies;
- atau oleh trusted server-side application code.

Bukan sebagai arbitrary client RPC.

---

# 8. Administrative / Sensitive RPC

Functions seperti:

```text
get_admin_dashboard_summary(...)
get_audit_logs(...)
get_pending_registrations()
get_registration_history()
get_honor_statistics(...)
count_referees(...)
```

 tidak boleh diberi anonymous EXECUTE.

Target:

```text
anon          DENY
authenticated DENY by default
```

Kemudian hanya diberikan kepada `authenticated` jika caller matrix membuktikan function memang dipanggil langsung dari browser.

Authorization harus dilakukan berdasarkan role dan region.

Contoh penting:

`get_admin_dashboard_summary(NULL, ...)`

secara semantik dapat meminta seluruh wilayah.

Karena itu:

> `_kabupaten_kota_id = NULL` tidak boleh otomatis berarti "allowed for any authenticated user".

---

# 9. Trigger/Internal Functions

Functions berikut merupakan internal database behavior:

```text
handle_new_user()
handle_honor_verification()
log_honor_verification()
log_referee_assignment()
log_registration_approval()
prevent_hard_delete()
soft_delete_record()
sync_card_expiry()
update_topic_reply_count()
validate_honor_submission()
validate_referee_assignment()
enforce_referee_assignment_update_scope()
```

Target:

```text
anon          DENY
authenticated DENY
```

Trigger tetap aktif.

Penting:

```text
REVOKE EXECUTE
```

 tidak boleh diterjemahkan sebagai:

```text
disable trigger
```

Trigger execution harus tetap berjalan melalui PostgreSQL trigger mechanism.

---

# 10. Card Number Generation

Current Production:

```text
generate_card_number(uuid)
```

adalah SECURITY DEFINER dan masih menggunakan:

```text
MAX(sequence) + 1
```

Function ini:

```text
anon          DENY
authenticated DENY
```

harus diperlakukan sebagai legacy/internal function.

Untuk canonical architecture, counter-based issuance menjadi target:

```text
referee_card_counters
```

dengan atomic sequence update.

Production legacy numbers wajib dipertahankan.

---

# 11. Card Counter Contract

Production evidence:

```text
2026 / 730 / max 38
2026 / 731 / max 77
2026 / 732 / max 15
2026 / 737 / max 54
2026 / XXX / max 3
```

Region `737` memiliki gap:

```text
0040
```

Gap tidak boleh direuse.

`XXX` adalah legacy namespace.

Contract:

```text
DO NOT renumber historical cards
DO NOT reuse 0040
DO NOT seed counters using COUNT(*)
DO seed from MAX(existing sequence)
DO NOT create new canonical XXX issuance
```

Final migration harus memasukkan assertion terhadap legacy state.

---

# 12. SECURITY DEFINER Search Path Contract

Current Production:

```text
SET search_path = public
```

Target:

```text
SET search_path = ''
```

sejauh function body dapat sepenuhnya menggunakan schema-qualified references.

Contoh target:

```text
public.profiles
public.user_roles
public.events
public.event_assignments
pg_catalog.*
```

Function yang masih menggunakan unqualified references wajib diperbaiki sebelum search_path dikosongkan.

Contoh yang ditemukan:

`get_referees()` masih menggunakan:

```text
profiles
user_roles
```

dan juga memakai deprecated:

```text
auth.role()
```

Contract final:

- tidak menggunakan `auth.role()` untuk authorization;
- gunakan explicit `TO authenticated` pada policy;
- function authorization menggunakan `auth.uid()` dan role tables;
- semua object references dikualifikasi;
- tidak mengandalkan mutable search path.

---

# 13. High-Risk SECURITY DEFINER Functions

## get_user_kabupaten_kota()

Current:

```text
_user_id -> profiles.kabupaten_kota_id
```

Risk:

arbitrary `_user_id`.

Target:

```text
internal only
```

atau refactor menjadi caller-bound helper:

```text
auth.uid()
```

bila caller contract memungkinkan.

---

## get_user_kabupaten_kota_id()

Sama:

```text
internal only
```

---

## has_schedule_conflict()

Current function menerima:

```text
_referee_id
_event_id
```

Meskipun read-only, arbitrary referee ID dapat menjadi information oracle.

Target:

```text
anon DENY
authenticated DENY
```

unless direct application caller is proven and authorization is added.

---

## get_referees()

Current function masih memiliki:

```text
auth.role() = 'authenticated'
OR p.is_active = true
```

Ini tidak boleh menjadi final security boundary.

Target:

- authenticated application RPC only;
- explicit authorization;
- sensitive fields reviewed;
- no anonymous execution;
- no `auth.role()`.

---

# 14. Public Profile Boundary

`get_public_referee*` boleh menjadi public projection.

Namun:

```text
profiles
```

tidak boleh dianggap public merely because an existing RLS policy says:

```text
Public can view referee profiles
```

Final architecture harus membedakan:

```text
profiles = private/domain source
public referee projection = explicitly safe fields
```

Public access sebaiknya melalui:

- dedicated safe RPC;
- atau dedicated safe view dengan correct security semantics.

---

# 15. Existing Sensitive Tables

The following remain private/internal:

```text
system_settings
activity_logs
auth_attempts
event_logs
```

No browser read/write contract.

Particularly:

```text
system_settings
```

must NOT regain direct browser access.

Public configuration belongs to:

```text
public_application_settings
```

with an explicit allowlist.

---

# 16. Canonical Notification Tables

The following are internal:

```text
assignment_notifications
event_completion_notifications
message_delivery_ledger
meta_webhook_events
notification_channel_claims
```

Final RLS:

```text
anon          DENY
authenticated DENY
```

No permissive placeholder policy.

Trusted access occurs through:

- SECURITY DEFINER internal functions;
- service-role Edge Functions;
- triggers.

---

# 17. referee_contacts

This is the exception among notification-related tables.

Browser contract:

```text
authenticated wasit
```

may:

```text
SELECT own row
INSERT own row
UPDATE own row
```

Ownership:

```text
auth.uid() = referee_id
```

and role:

```text
has_role(auth.uid(), 'wasit')
```

must be enforced.

No arbitrary referee contact lookup.

No anonymous access.

---

# 18. public_application_settings

Final browser contract:

```text
authenticated:
    SELECT = ALLOW

authenticated:
    INSERT = DENY
    UPDATE = DENY
    DELETE = DENY

service_role:
    management = ALLOW
```

The safe allowlist remains:

```text
app_name
organization_name
organization_phone
organization_address
organization_email
association_email
sender_email_name
sender_email_address
email_provider
max_event_referees
honor_base_amount
```

Private values remain outside this table.

Examples that must never enter browser-readable settings:

```text
resend_api_key
smtp_user
smtp_password
KIRISAN_API_TOKEN
KIRISAN_WHATSAPP_DEVICE_TOKEN
KIRISAN_WEBHOOK_SECRET
META_APP_SECRET
META_WEBHOOK_VERIFY_TOKEN
```

---

# 19. Notification RPC Boundary

These are internal RPCs:

```text
claim_notification_channel(...)
finalize_notification_channel(...)
claim_event_completion_notification(...)
finalize_event_completion_notification(...)
create_event_completion_notification_intents(...)
```

Target:

```text
anon          DENY
authenticated DENY
```

They are invoked through trusted server-side paths.

Their existing Test design provides a useful canonical reference:

- claim is atomic;
- claim expires;
- claim ownership is checked;
- finalize requires matching claim;
- duplicate intent creation uses `ON CONFLICT DO NOTHING`.

---

# 20. Edge Function Boundary

## notification-orchestrator

Required:

```text
JWT = required
resolveCaller() = required
role authorization = required
scope authorization = required
service-role DB access = server-side only
```

Allowed roles identified:

```text
admin_provinsi
admin_kab_kota
panitia
```

Database internal claim/finalize functions must not become direct browser RPCs.

---

## send-whatsapp

Required:

```text
JWT = required
resolveCaller() = required
admin_provinsi authorization
provider credentials = server-side secret
```

Kirisan credentials must never be returned to browser.

---

# 21. Kirisan Webhook

This boundary intentionally differs from normal application functions.

```text
verify_jwt = false
```

is acceptable because the caller is the external provider.

Authentication must instead use:

```text
X-Kirisan-Event
X-Webhook-Secret
```

plus strict payload validation.

Target flow:

```text
Kirisan
  |
  v
kirisan-webhook
  |
  +-- secret validation
  +-- payload validation
  +-- idempotency
  |
  v
message_delivery_ledger
```

No browser authentication token should be required for the provider webhook.

---

# 22. Meta WhatsApp Webhook

Same principle:

```text
verify_jwt = false
```

is intentional.

Authentication:

```text
META_WEBHOOK_VERIFY_TOKEN
META_APP_SECRET
HMAC SHA-256
constant-time comparison
```

Target flow:

```text
Meta
  |
  v
meta-whatsapp-webhook
  |
  +-- signature verification
  +-- payload normalization
  +-- deduplication
  |
  v
meta_webhook_events
```

---

# 23. Webhook Idempotency

Canonical uniqueness contracts:

### assignment_notifications

```text
UNIQUE assignment_id
```

### event_completion_notifications

```text
UNIQUE(event_id, referee_id, channel)
```

### message_delivery_ledger

```text
UNIQUE idempotency_key
UNIQUE(provider, environment, event_type, provider_request_id)
```

### meta_webhook_events

```text
UNIQUE event_key
UNIQUE(provider,waba_id,phone_number_id,wamid,
       lifecycle_status,provider_event_timestamp)
```

### notification_channel_claims

```text
PRIMARY KEY (assignment_id, channel)
UNIQUE claim_id
```

These constraints are part of the security boundary, not merely database optimization.

---

# 24. Event Completion Notification Contract

Trigger condition:

```text
DISETUJUI -> SELESAI
```

Only this transition creates notification intents.

Historical:

```text
SELESAI
```

events must NOT receive automatic notification backfill during migration.

Existing 116 completed events therefore remain historical state.

Idempotency:

```text
ON CONFLICT (event_id, referee_id, channel)
DO NOTHING
```

must remain.

---

# 25. RLS Contract

Final RLS strategy:

| Object | Anonymous | Authenticated | Trusted server |
| --- | --- | --- | --- |
| `public_application_settings` | DENY | SELECT safe values ALLOW | ALLOW |
| `referee_contacts` | DENY | own rows ALLOW | ALLOW |
| `assignment_notifications` | DENY | DENY | ALLOW |
| `event_completion_notifications` | DENY | DENY | ALLOW |
| `message_delivery_ledger` | DENY | DENY | ALLOW |
| `meta_webhook_events` | DENY | DENY | ALLOW |
| `notification_channel_claims` | DENY | DENY | ALLOW |
| `referee_card_counters` | DENY | DENY | ALLOW |
| `system_settings` | DENY | DENY | ALLOW |
| internal logs | DENY | DENY | ALLOW for explicit admin contract |

No `USING (true)` policy should be introduced merely to make a migration pass.

---

# 26. Existing High-Risk RLS — Remediation Track

These existing policies remain under explicit review:

```text
event_approvals
referee_reviews
profiles
events
pengurus
```

Particularly:

### event_approvals

Existing:

```text
Everyone can view event approvals
USING (true)
```

This must not be automatically preserved as canonical security behavior without business confirmation.

### referee_reviews

Existing anonymous:

```text
Anyone can submit reviews
Anyone can view reviews
```

Requires separate abuse/business-rule contract.

### events

Existing:

```text
Everyone can view events
USING (true)
```

Requires public event-field contract.

These are not silently "fixed" in Phase 1.7 karena changing them without application/business evidence could break legitimate public functionality.

---

# 27. Explicit Policy Targeting

Future hardened policies should prefer:

```text
TO authenticated
```

atau:

```text
TO anon
```

instead of relying on:

```text
roles = {public}
```

Authorization must still be expressed through predicates.

For UPDATE:

```text
USING
+
WITH CHECK
```

must both be evaluated.

`TO authenticated` alone is not authorization.

---

# 28. Final Function Classification

## PUBLIC-SAFE

```text
get_public_referee
get_public_referees
verify_referee_card
```

## AUTHENTICATED APPLICATION RPC

```text
get_referees
get_referee_event_count
get_referee_income_summary
get_my_referee_event_count
has_schedule_conflict       [subject to caller/authorization confirmation]
transition_event_assignment_status
```

## ADMIN / PRIVILEGED APPLICATION RPC

```text
get_admin_dashboard_summary
get_audit_logs
get_pending_registrations
get_registration_history
get_honor_statistics
count_referees
```

Final role-specific authorization must be frozen before EXECUTE is granted.

## INTERNAL AUTHORIZATION

```text
has_role
is_admin
is_admin_kab_kota
is_admin_provinsi
is_same_region
can_access_region
get_user_kabupaten_kota
get_user_kabupaten_kota_id
validate_regional_access
```

## INTERNAL / TRIGGER ONLY

```text
auto_mark_expired_cards
enforce_referee_assignment_update_scope
handle_honor_verification
handle_new_user
log_honor_verification
log_referee_assignment
log_registration_approval
prevent_hard_delete
soft_delete_record
sync_card_expiry
update_topic_reply_count
validate_honor_submission
validate_referee_assignment
```

## LEGACY INTERNAL

```text
generate_card_number
```

---

# 29. Final Search Path Policy

Every SECURITY DEFINER function entering the canonical migration must satisfy:

```text
search_path = ''
```

where technically feasible.

Exception requires explicit documented justification.

`public,pg_temp` is not accepted merely because it is convenient.

Any exception must document:

- why empty search_path cannot be used;
- which unqualified objects require resolution;
- why the object resolution is safe;
- caller boundary;
- EXECUTE boundary.

---

# 30. Migration Preconditions

Phase 1.8 migration must abort before mutation if:

1. required parent table missing;
2. required parent column missing;
3. FK type mismatch;
4. orphan relationship detected;
5. duplicate canonical identity detected;
6. existing card number duplicate detected;
7. card sequence baseline differs from audited state;
8. unexpected legacy cancellation count;
9. existing canonical table collision;
10. trigger preservation assertion fails;
11. required function signature missing;
12. unexpected function signature exists;
13. security boundary assertion fails.

Migration must be transactional.

---

# 31. Rollback Contract

Rollback must restore the exact pre-migration state.

Do NOT use:

```text
GRANT ALL TO PUBLIC
```

as rollback.

The rollback artifact must restore:

- exact function ACL;
- exact RLS policies;
- exact table grants;
- exact functions;
- exact triggers;
- exact canonical objects created by the migration.

Legacy Production objects must not be deleted merely because they are absent from Test.

---

# 32. Final Phase 1.7 Gate

| Area | Result |
| --- | --- |
| Public RPC boundary | PASS |
| Authenticated RPC boundary | PASS* |
| Internal RPC boundary | PASS |
| Trigger-only boundary | PASS |
| Edge Function boundary | PASS |
| Kirisan webhook boundary | PASS |
| Meta webhook boundary | PASS |
| Notification RLS design | PASS |
| Public settings boundary | PASS |
| System settings isolation | PASS |
| Card counter security boundary | PASS |
| Legacy card exception | PASS |
| Event notification transition contract | PASS |
| SECURITY DEFINER policy | PASS* |
| Exact caller matrix | PARTIAL |
| Existing high-risk RLS semantics | PARTIAL |
| Final migration SQL | NOT YET ASSEMBLED |
| Test dry-run | NOT YET EXECUTED |
| Production mutation | 0 |

*Requires final implementation/static verification.

# FINAL STATUS

**PHASE 1.7 — BLOCKED / SECURITY BOUNDARY CONTRACT FROZEN FOR PHASE 1.8**

The security architecture is now sufficiently defined to proceed to:

**PHASE 1.8 — Final Migration Assembly & Static Gate**

Phase 1.8 should not execute the migration.

Its purpose is to assemble the final SQL from this contract, attach all preflight assertions and rollback logic, then perform static verification against the live Production catalog before any Test execution.
