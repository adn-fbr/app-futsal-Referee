# Safe Settings Boundary Audit - Production WhatsApp Discovery

## PROJECT IDENTITY

Project: `AFP SULSEL`  
Production Ref: `xfscfjwapwnkiinkgbjg`  
Repository Target: `shorsqyycpptxcutrqrb`  
Test Project Excluded: `YES`

## PRODUCTION SESSION

Production Identity: `VERIFIED`  
transaction_read_only: `on`  
Database: `postgres`  
PostgreSQL: `17.6`

The production metadata session used an explicit read-only transaction and
rolled back. No application rows were selected.

## SOURCE CONTRACT

useSettings object: `public_system_settings`  
Selected columns: `*`  
Authentication: Supabase client session; application source expects the view's
authenticated access path  
select("*") present: `YES`

The hook maps every returned field into a settings map. The interface includes
`value`, so the client contract can receive the generic underlying settings
value. The hook separately writes directly to `system_settings` for mutations;
those writes are not a safe read-only discovery path.

## SAFE VIEW

public_system_settings: `DEFINED STATICALLY; NOT RESOLVABLE IN PRODUCTION`  
Object type: `VIEW` in the migration definition  
Source table: `public.system_settings`  
Secret-bearing source columns: `value` is generic and may contain secret settings  
Secret-bearing exposed columns: `value` is exposed by the static view definition  
Safe exposed columns: `id`, `key`, `description`, `updated_by`, `created_at`,
`updated_at` only if independently classified; `value` is not safe by default

The canonical migration defines:

```sql
SELECT id, key, value, description, updated_by, created_at, updated_at
FROM public.system_settings
WHERE key NOT IN (...secret key names...)
```

This is not a sufficient generic secret boundary because it exposes
`system_settings.value` for every non-excluded key. The frontend also requests
`select("*")`. The migration excludes known keys such as `whatsapp_api_key`,
but exclusion by key name does not prove that all secret-bearing values are
excluded.

## DEPLOYED STATUS

public_system_settings resolvable: `NO / UNKNOWN`  
Existing application access: source-configured, production deployment not verified  
Safe read-only access: `NO`

Production `to_regclass('public.public_system_settings')` returned `NULL`; no
view rows or definition were read. The role's restricted visibility means this
is not treated as definitive object absence.

No deployed function was invoked. Existing deployed functions that read
`public_system_settings` perform email/notification operations and are not safe
metadata-only discovery endpoints.

## LEGACY WHATSAPP

Legacy WhatsApp state: `UNKNOWN`  
Legacy credential state: `UNKNOWN`  
Legacy ciphertext state: `UNKNOWN`

The public boundary cannot establish whether legacy WhatsApp state exists in
the underlying `system_settings` table.

## SECRETS

WHATSAPP_ENCRYPTION_KEY: `ABSENT` from the already verified production Edge
Function secret-name listing  
Secret value accessed: `NO`

## VAULT

Vault accessed: `NO`  
Vault secret read: `NO`  
Vault mutation: `NO`

## PROVIDER

Provider contacted: `NO`  
Real credential used: `NO`

## MUTATION COUNTERS

INSERT: `0`  
UPDATE: `0`  
DELETE: `0`  
MERGE: `0`  
DDL: `0`  
GRANT: `0`  
REVOKE: `0`  
RLS changes: `0`  
Migration: `0`  
Vault mutation: `0`  
Credential rotation: `0`  
Provider calls: `0`

## FINAL GATES

### Gate A - Boundary

**BLOCKED — PUBLIC SETTINGS BOUNDARY MAY EXPOSE SECRET MATERIAL**

Static contract exposes the generic `value` column, and production deployment
could not be verified.

### Gate B - Legacy State

**UNKNOWN — LEGACY WHATSAPP STATE REMAINS UNVERIFIED**

No safe key-only access path exists, and no application rows were read.