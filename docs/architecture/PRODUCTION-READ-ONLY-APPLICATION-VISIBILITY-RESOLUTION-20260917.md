# Production Read-Only Application Visibility Resolution

## PROJECT IDENTITY

Project: `AFP SULSEL`  
Production Ref: `xfscfjwapwnkiinkgbjg`  
Repository Target: `shorsqyycpptxcutrqrb`  
Test Project Excluded: `YES`

## DATABASE SESSION

Database: `postgres`  
Schema: `public`  
Database Role: restricted production CLI login role  
PostgreSQL: `17.6`  
transaction_read_only: `on`  
Production Identity: `VERIFIED`

The fresh session used an explicit read-only transaction and rolled back.

## ACCESS PATH

Existing authorized read path: **NONE VERIFIED**  
Path type: no safe key-only database or application endpoint found  
Authorization basis: existing production CLI login is catalog-capable but has
no SELECT on `public.system_settings` or `public.audit_logs`  
Read-only: database session verified; application metadata access unavailable  
Safe non-secret scope: catalog metadata only

Inspected existing paths:

- `useSettings.ts` reads `public_system_settings` with `select("*")` and
  reads `system_settings` values for writes; it is not a key-only path.
- deployed `test-email-config`, `send-event-notification`, and
  `send-assignment-notification` read `key,value` pairs for email operations;
  they do not expose a safe WhatsApp key metadata endpoint.
- invoking those functions would require authenticated application context and
  could perform email/provider operations, which is outside this phase.
- no existing safe RPC or admin metadata endpoint was found.

No function was invoked and no application code was modified.

## SYSTEM_SETTINGS

Object resolvable: `YES`  
Safe key visibility: `NO` with the current diagnostic role  
WhatsApp-related keys: `UNKNOWN`  
Value column accessed: `NO`

The table schema is known from catalog metadata, but table SELECT is denied.
No values or key rows were retrieved.

## PRIVATE_WHATSAPP_SETTINGS

Existence: `UNKNOWN`  
Metadata visibility: unresolved through the restricted application catalog path  
Row contents accessed: `NO`

`to_regclass` returned `NULL`, but this is not treated as proof of absence under
the restricted visibility rules.

## AUDIT_LOGS

Safe action visibility: `NO` with the current diagnostic role  
WhatsApp-related actions: `UNKNOWN`  
Payloads accessed: `NO`

## SECRETS

WHATSAPP_ENCRYPTION_KEY: `ABSENT` from the production Edge Function secret-name listing  
Secret value accessed: `NO`  
Secret-derived data exposed: `NO`

## VAULT

Vault accessed: `NO`  
Vault secret read: `NO`  
Vault mutation: `NO`

## PROVIDER

WhatsApp provider contacted: `NO`  
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

## FINAL GATE

**BLOCKED — NO AUTHORIZED READ-ONLY APPLICATION VISIBILITY PATH**

Resolving this requires a separately governed existing read-only application
role/path or an approved metadata endpoint. This phase did not create either
one and did not change production permissions, RLS, code, or deployment.