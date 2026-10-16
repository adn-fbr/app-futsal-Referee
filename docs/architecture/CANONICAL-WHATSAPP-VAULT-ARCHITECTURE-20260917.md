# Canonical WhatsApp Vault Architecture

Status: design only. No migration is executed by this document.

## Current architecture

The current UI sends `secretValue` to the authenticated Edge Functions. The
functions use `WHATSAPP_ENCRYPTION_KEY` to AES-GCM encrypt and decrypt
`private_whatsapp_settings.api_key_ciphertext`. The current proposed migration
would create that encrypted-column table, but it is intentionally not executed.

The current settings UI represents one global provider configuration. The
upsert function queries one row with `.limit(1)` and does not accept a tenant,
region, or Vault secret identifier. No Vault call exists in the application.

Legacy `system_settings` keys are present in the settings contract and are
excluded from the public settings boundary only inconsistently: the existing
boundary explicitly excludes `whatsapp_api_key`, while the later unexecuted
proposal also excludes the non-secret WhatsApp metadata keys. They remain
legacy evidence and are not deleted by this design.

## Target architecture

```text
Browser
  -> authenticated Edge Function
  -> resolve caller and require admin_provinsi
  -> load the singleton public.private_whatsapp_settings row
  -> use its vault_secret_id with vault.decrypted_secrets
  -> provider request from the server only
  -> sanitized status/metadata response
```

### Application metadata

The canonical application table is `public.private_whatsapp_settings`, with
only these fields:

- `id uuid primary key`
- a singleton discriminator, for example `singleton_key text not null unique`
- `provider text not null`
- `api_base_url text`
- `sender_number text`
- `enabled boolean not null default false`
- `vault_secret_id uuid unique`, nullable until a key is configured
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `updated_by uuid` referencing the application profile when consistent with
  the approved baseline

The discriminator must be constrained to one value such as `default`, making
the singleton rule database-enforced rather than dependent on `.limit(1)`.
The reference is not a browser-controlled input and should not be a foreign
key into the managed Vault schema unless that cross-schema dependency is
explicitly approved.

### Vault secret

The API key is stored only in the local Supabase Vault. The deterministic,
non-sensitive name is:

```text
afp-whatsapp-config-<application configuration UUID>
```

The name contains no credential material and is not returned to the browser.
The API key is never copied into application tables, settings, audit data,
logs, URLs, or responses.

## Lifecycle decisions

### Create

1. Resolve the bearer caller.
2. Require `admin_provinsi` before creating a service-role client operation.
3. Validate provider metadata and the API-key input server-side.
4. Read the singleton configuration row; ignore any client-supplied secret ID.
5. Create one Vault secret using the deterministic name.
6. Insert/update the metadata row with the returned UUID.
7. Return only `configured`, provider, endpoint, sender, and enabled state.

Vault and Postgres do not share a transaction. If metadata persistence fails
after Vault creation, the server must compensate by deleting that exact newly
created Vault UUID using an approved server-only deletion capability. If that
capability is unavailable, the operation must return an internal failure and
raise an operator-cleanup condition; it must not silently create an orphan.

### Metadata-only update

Update provider, base URL, sender, enabled state, and audit metadata without
calling Vault. The existing `vault_secret_id` remains unchanged.

### API-key rotation

When a non-empty new API key is supplied, resolve the existing UUID from the
authorized singleton row and call `vault.update_secret()` for that UUID. Do not
accept a UUID from the browser and do not create a second secret. Update
metadata only after the Vault rotation succeeds. Since the UUID is unchanged,
an application metadata update failure does not point the row at the wrong
secret, but the operation must still return a sanitized failure.

### Disable/enable

`enabled = false` means the provider is not used. The Vault secret remains
managed and referenced so re-enabling does not require re-entering the key.
Disabled configurations must not be used by notification delivery or test
connection operations.

### Revoke/delete

The current product has no verified delete/revoke workflow. This phase does
not add one. A future revoke operation must authorize `admin_provinsi`, delete
the Vault secret server-side, remove the metadata row, and write a non-secret
audit event. Cross-system deletion is not atomic; compensation and retry
semantics require an approved Vault deletion API or an explicitly approved
server-side delete capability.

## Public boundary and RLS

`public.public_whatsapp_settings` may expose only:

- provider
- API base URL
- sender number
- enabled
- `configured = (vault_secret_id is not null)`
- timestamps if needed by the UI

It must not expose `vault_secret_id`, API key material, ciphertext, Vault
names, or decrypted values. The private table should have no grants to
`anon` or `authenticated`; browser reads and writes go through the Edge
Functions. The public view should use `security_invoker = true` and grant only
the minimum metadata read needed by the approved UI contract.

The Edge Functions use the service role only after authentication and the
canonical `hasAnyRole(caller, ["admin_provinsi"])` check. A client cannot
select a configuration UUID, Vault UUID, region, or tenant. The server derives
the singleton row and reference itself, preventing IDOR against either
application rows or Vault secrets.

## Edge Function contracts

### `upsert-whatsapp-config`

- accept metadata and an optional ephemeral API-key input
- reject any client-supplied `vault_secret_id`
- authenticate and authorize before privileged access
- create or rotate the Vault secret only when required
- persist only the reference and metadata
- write `WHATSAPP_CONFIG_CREATED`, `WHATSAPP_CONFIG_UPDATED`,
  `WHATSAPP_CONFIG_ROTATED`, or enable/disable audit events
- audit metadata contains no key, ciphertext, Vault decrypted record, or raw
  provider data
- return sanitized metadata and configured status only

### `test-whatsapp-config`

- accept only the operation context and optional ephemeral test metadata
- resolve the singleton configuration on the server
- reject arbitrary Vault UUIDs
- require the configuration to be enabled and configured
- read `vault.decrypted_secrets` server-side
- send provider credentials only in the server-side provider request
- return only a sanitized success/failure result
- never return provider responses, headers, URLs with credentials, database
  errors, Vault errors, or decrypted values

The existing shared error boundary remains the response contract for unexpected
failures.

## Auditability

Reuse `public.audit_logs`, which already contains `action`, `entity_type`,
`entity_id`, actor, old/new JSON, metadata, and timestamp fields. Store only
non-secret state transitions and metadata. Never place the API key,
`api_key_ciphertext`, Vault decrypted values, request bodies, authorization
headers, or provider payloads in audit fields.

Use the existing `public.update_updated_at_column()` trigger convention. Do not
introduce another `set_updated_at()` function.

## Proposed migration design, not executed

The future reviewed migration should:

1. add or create the singleton metadata table with `vault_secret_id` and no
   ciphertext column;
2. add the singleton constraint and safe metadata checks;
3. reuse `update_updated_at_column()`;
4. enable RLS and deny browser access to the private table;
5. create a security-invoker public metadata view with `configured` only;
6. grant only the approved public metadata read;
7. deprecate legacy WhatsApp system-setting keys without deleting them;
8. add no Vault secrets and perform no data migration until an explicit
   non-production migration plan is approved.

The migration must be created as a new reviewed baseline-forward migration.
It must not execute `20260917000000_whatsapp_settings_security.sql`, edit
historical migrations, or use `IF NOT EXISTS` to conceal schema conflicts.

## Legacy retirement sequence

1. Implement and review the Vault-backed Edge Function contract.
2. Verify it in isolated non-production with synthetic data.
3. Define an approved migration path for any existing encrypted settings.
4. Disable reads and writes through the AES-GCM path.
5. Retire `WHATSAPP_ENCRYPTION_KEY` from function configuration.
6. Remove `api_key_ciphertext` only through a reviewed forward migration after
   proving no active reader remains.
7. Retain or formally supersede the old migration artifact; never rewrite it.

## Security decision matrix

| Decision | Canonical answer |
| --- | --- |
| Secret | Supabase Vault only |
| Reference | `private_whatsapp_settings.vault_secret_id` |
| Metadata | Singleton `private_whatsapp_settings` row |
| Authorization | Authenticated Edge Function plus `admin_provinsi` |
| Rotation | `vault.update_secret()` on the server using the stored reference |
| Disable | Stop provider use; retain the Vault secret |
| Revoke | Future explicit server-only lifecycle operation; not currently supported |
| Audit | Existing `audit_logs`, non-secret state only |
| Client | Sanitized metadata, configured/enabled status, no UUID or secret |
| Legacy | Migrate, disable, then retire AES-GCM and ciphertext in later phases |

## Unresolved questions

- The local Vault catalog exposes create/update and server-side delete table
  privilege, but no public `vault.delete_secret()` function. The approved
  deletion/compensation mechanism must be decided before implementing create
  failure cleanup or revoke.
- Existing encrypted WhatsApp values, if any exist outside this local baseline,
  require an approved one-time migration procedure. No production inspection
  was performed and no migration is proposed here.
- The current frontend still hydrates legacy `system_settings` keys for
  WhatsApp metadata. The replacement read contract must be selected before UI
  migration: Edge Function response or the safe public metadata view.
- Provider request semantics are not proven in the repository; provider
  integration and provider-specific failure mapping require a later phase.

## Execution status

- migration executed: **NO**
- production accessed: **NO**
- production modified: **NO**
- real WhatsApp credential used: **NO**
- provider contacted: **NO**
- Vault secret created or modified in this phase: **NO**