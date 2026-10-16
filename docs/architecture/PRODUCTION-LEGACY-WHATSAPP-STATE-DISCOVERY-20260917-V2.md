# Production Legacy WhatsApp State Discovery - Read Only v2.0

## 1. PROJECT IDENTITY

Project: `AFP SULSEL`  
Production Ref: `xfscfjwapwnkiinkgbjg`  
Repository Target: `shorsqyycpptxcutrqrb`  
Test Project Excluded: `YES`

The authenticated production link and project identity were verified before
the database sessions.

## 2. DATABASE SESSION

Database: `postgres`  
Schema: `public`  
Database Role: restricted CLI login role; exact role is not repeated in this report  
PostgreSQL: `17.6`  
transaction_read_only: `on`  
Production Identity: `VERIFIED`

A fresh session used `BEGIN; SET TRANSACTION READ ONLY; ... ROLLBACK;`.

## 3. CATALOG VISIBILITY

public schema visible: `YES`; 124 visible public relations were reported.  
pg_catalog visible: `YES`  
information_schema visible: `YES`, but application-table rows/metadata are restricted through this role  
system_settings resolvable: `YES`  
private_whatsapp_settings resolvable: `NULL` from `to_regclass`; existence is not conclusively classified because the role has restricted application visibility  
audit_logs resolvable: `YES`

The role has no SELECT privilege on `public.system_settings` or
`public.audit_logs`. A direct key/action read stopped with permission denied;
no application values were returned.

## 4. LEGACY WHATSAPP STATE

system_settings WhatsApp configuration: `UNKNOWN`  
legacy secret-bearing column: `UNKNOWN` for production WhatsApp-specific state; safe table metadata confirms only a generic `value text` column  
private_whatsapp_settings: `UNKNOWN`  
legacy ciphertext: `UNKNOWN`  
legacy credential: `UNKNOWN`

Safe metadata established:

- `system_settings`: `id`, `key`, `value`, `description`, `updated_by`,
  `created_at`, `updated_at`
- primary key on `id`
- unique constraint/index on `key`
- RLS enabled
- no direct SELECT privilege for the diagnostic role
- `audit_logs`: `id`, `action`, `entity_type`, `entity_id`, `actor_id`,
  `old_data`, `new_data`, `metadata`, `created_at`
- RLS enabled on `audit_logs`

No system-setting keys, WhatsApp audit actions, configuration rows, or secret
values were selected.

## 5. ENCRYPTION KEY STATUS

`WHATSAPP_ENCRYPTION_KEY`: `ABSENT` from the production Edge Function secret
name listing. Secret values, digests, and metadata beyond presence were not
reported.

## 6. VAULT

Vault accessed: `NO`  
Vault secret read: `NO`  
Vault mutation: `NO`

## 7. PROVIDER

WhatsApp provider contacted: `NO`  
Real credential used: `NO`

## 8. MUTATION COUNTERS

INSERT: `0`  
UPDATE: `0`  
DELETE: `0`  
DDL: `0`  
Migration: `0`  
Vault mutation: `0`  
Credential rotation: `0`

## 9. EVIDENCE

- production PostgreSQL session: established
- transaction read-only mode: `on`
- database: `postgres`
- schema: `public`
- PostgreSQL: `17.6`
- visible public relations: `124`
- `system_settings` and `audit_logs`: resolvable
- `private_whatsapp_settings`: not resolved by this role
- `system_settings` and `audit_logs`: SELECT denied to diagnostic role
- safe table columns, constraints, indexes, RLS, and policy names inspected
- production Edge Function secret names inspected without retrieving values

## 10. FINAL GATE

**BLOCKED — PRODUCTION APPLICATION CATALOG VISIBILITY NOT VERIFIED**

The production connection and read-only posture are verified, but the
diagnostic role cannot read application rows and cannot conclusively establish
the relevant legacy WhatsApp state. No permissions were changed to overcome
this limitation.