# Safe Settings Boundary Remediation Design

Status: design only. No production change, migration, deployment, or settings
value read was performed.

## A. CURRENT STATE

`public_system_settings` is statically defined as a view over
`public.system_settings`. The view currently projects:

```text
id, key, value, description, updated_by, created_at, updated_at
```

It excludes a list of known secret keys, but still exposes the generic
`value` column for all other keys. `useSettings.ts` queries the view with
`select("*")` and converts every returned value into a browser settings map.

`useSettings.ts` also directly updates `system_settings.value` through
`useUpdateSetting` and `useBulkUpdateSettings`. The bulk path filters only
`SECRET_SETTING_KEYS`, so mixed-sensitivity settings remain client-writeable.

Current WhatsApp UI configuration is sent to Edge Functions, but the generic
settings hydration still references legacy WhatsApp metadata keys.

## B. SECURITY FINDINGS

### Confirmed

- **Generic value exposure:** the view and client contract expose generic
  `system_settings.value` through `public_system_settings`.
- **Client direct write:** the browser can update `system_settings.value`
  through the generic hooks.
- **Mixed public/private store:** public branding, operational settings, email
  metadata, provider credentials, and legacy WhatsApp keys share one table.
- **Email credential risk:** `resend_api_key`, `smtp_user`,
  `smtp_password`, `smtp_host`, `smtp_port`, and `smtp_secure` are represented
  in the mixed settings model; known secret keys are filtered, but the generic
  value contract is unsafe for future/unknown keys.
- **WhatsApp risk:** the public boundary includes generic `value`, while
  WhatsApp legacy state remains unknown. This boundary cannot prove safety by
  key exclusion alone.
- **RLS dependency:** current access depends on policies over the mixed table
  and a security-invoker view, rather than an explicit public-safe data model.
- **Authorization gap:** generic client writes are not routed through the
  canonical server-side admin configuration boundary.

### Not established

- Production rows and values were not accessed.
- Legacy WhatsApp state remains `UNKNOWN`.
- Production deployment of the public view remains unverified.

## C. CANONICAL REMEDIATION

Selected architecture: **explicit public allowlist plus server-side writes**.

### Public read path

Create a reviewed allowlisted public read contract. The preferred initial
implementation is a dedicated `public_application_settings` table containing
only proven public values, because the existing `system_settings` table mixes
secrets and operational values. A view over the mixed table is acceptable only
as an interim non-production bridge if it projects explicit allowlisted keys
and no generic `value` column.

The browser read response must be typed safe fields, not `select("*")` from a
mixed store.

### Private read path

Private settings remain server-only. Edge Functions may read private metadata
with service-role access only after authentication and authorization.

### Admin write path

All settings writes move behind an authenticated Edge Function that:

1. resolves the caller using the canonical authorization helper;
2. requires the approved role for the setting class;
3. accepts an explicit allowlisted setting name and typed value;
4. rejects secret-bearing names and unknown names;
5. writes through a server-side client;
6. records a non-secret audit event;
7. returns only sanitized metadata/status.

### Secret-management path

Email/provider credentials use deployment secrets or their separately approved
secret architecture. WhatsApp credentials use the future Vault-backed
`private_whatsapp_settings` design. Neither belongs in public settings.

### Audit path

Reuse `public.audit_logs`. Audit payloads contain setting name, actor, and
non-secret state only; never values for private settings, credentials,
ciphertext, headers, or decrypted data.

## D. ALLOWLIST

The following settings are proven public-safe from current source usage and
migration descriptions, subject to product-owner confirmation before a schema
change:

| Setting | Classification | Evidence/reason |
| --- | --- | --- |
| `app_name` | PUBLIC-SAFE | UI/application display name. |
| `organization_name` | PUBLIC-SAFE | Branding/display text. |
| `organization_phone` | PUBLIC-SAFE | Organization contact display. |
| `organization_address` | PUBLIC-SAFE | Organization contact display. |
| `organization_email` | PUBLIC-SAFE | Public organization contact. |
| `association_email` | PUBLIC-SAFE | Notification destination/organization contact; confirm product exposure before production rollout. |
| `sender_email_name` | PUBLIC-SAFE | Display sender name. |
| `sender_email_address` | PUBLIC-SAFE | Display sender address; domain/product confirmation required. |
| `email_provider` | PUBLIC-SAFE | Provider identifier only, not a credential. |
| `max_event_referees` | PUBLIC-SAFE | Numeric UI/business rule. |
| `honor_base_amount` | PUBLIC-SAFE | Product/business display value. |

The following are **PRIVATE** and must never enter the public view:

- `resend_api_key`
- `smtp_user`
- `smtp_password`
- `smtp_host`
- `smtp_port`
- `smtp_secure`
- `whatsapp_api_key`
- any future WhatsApp API key, token, ciphertext, Vault reference, or
  encryption material

The following remain **UNKNOWN / PRIVATE** until separately verified:

- `whatsapp_base_url`
- `whatsapp_sender_number`
- `whatsapp_provider`
- `whatsapp_enabled`
- any setting not listed in the explicit allowlist
- any setting whose value is not demonstrably non-sensitive

WhatsApp metadata should be returned by the dedicated authorized WhatsApp
configuration boundary only after its Vault architecture is implemented.

## E. MIGRATION PLAN

### Phase 1 - Non-production schema

- create a reviewed explicit public-safe table or allowlisted view design;
- remove generic `value` from the public projection;
- preserve legacy `system_settings` rows and columns;
- define RLS/grants in isolated non-production only;
- do not inspect or migrate production values.

### Phase 2 - Non-production application

- replace `useSettings.ts` wildcard reads with typed safe fields;
- route writes through a server-side settings function;
- update email notification consumers to use typed safe metadata plus
  deployment secrets for credentials;
- keep WhatsApp on its dedicated future Vault path.

### Phase 3 - Security tests

- prove allowlisted values are visible;
- prove private and unknown values are invisible;
- prove generic secret-like values cannot leak;
- test unauthenticated and non-admin writes;
- test role restrictions for `wasit`, `panitia`, `evaluator`,
  `admin_kab_kota`, and `admin_provinsi`;
- test no secret in responses, logs, browser storage, or audit payloads;
- run focused tests, typecheck, full tests, and build.

### Phase 4 - Production deployment preparation

- obtain an approved production read-only application visibility path;
- compare production keys without selecting values;
- review allowlist against actual production metadata;
- approve rollback and deployment order.

### Phase 5 - Production deployment

- separately authorized production change window;
- deploy schema and application changes in reviewed order;
- verify safe public contract without exposing private values;
- no WhatsApp credential migration in this remediation.

### Phase 6 - Legacy WhatsApp discovery/migration

- resolve production legacy state through a governed read-only path;
- if legacy state exists, design and approve controlled server-only migration;
- implement Vault migration separately;
- retire legacy paths only after verification.

No phase above was executed by this task.

## F. ROLLBACK PLAN

- retain the existing legacy table and keys during transition;
- keep the prior application release available for rollback;
- switch the frontend read contract back only to a reviewed safe projection,
  never to generic unrestricted `value`;
- disable the new admin write function if authorization or validation fails;
- restore the previous safe allowlist artifact in non-production first;
- do not rollback by re-exposing the generic mixed-sensitivity view;
- do not delete settings rows, credentials, Vault secrets, or historical
  migrations as part of rollback.

## G. PRODUCTION SAFETY

Production writes: `0`  
Production DDL: `0`  
Production migrations: `0`  
Production GRANT/REVOKE: `0`  
Production RLS changes: `0`  
Vault operations: `0`  
Provider calls: `0`  
Secret values accessed: `0`

## H. FINAL GATES

### Boundary remediation design

**PASS — SAFE SETTINGS BOUNDARY REMEDIATION DESIGN COMPLETE**

### Legacy WhatsApp state

**UNKNOWN — LEGACY WHATSAPP STATE REMAINS UNVERIFIED**