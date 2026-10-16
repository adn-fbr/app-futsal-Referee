# Review: WhatsApp Vault Migration Contract

Status: contract review only. No SQL was executed and no migration file was
created.

## Current schema

`private_whatsapp_settings` is not part of the current canonical baseline.
The baseline artifact contains no `private_whatsapp_settings`,
`public_whatsapp_settings`, `api_key_ciphertext`, or WhatsApp system-setting
object definitions. Consequently there are currently no verified table
columns, constraints, indexes, RLS settings, or policies for that table.

The unexecuted file `20260917000000_whatsapp_settings_security.sql` is only a
proposal and is not current schema evidence.

The canonical baseline does contain `system_settings` and `audit_logs`:

- `system_settings`: `id`, unique `key`, `value`, `description`, `updated_by`,
  `created_at`, `updated_at`, with RLS and existing settings policies.
- `audit_logs`: `id`, `action`, `entity_type`, non-null `entity_id`, `actor_id`,
  `old_data`, `new_data`, `metadata`, and `created_at`.

No WhatsApp key rows or values are retrieved or assumed. Static baseline
evidence contains no WhatsApp seed values.

## Legacy classification

| Item | Classification | Evidence |
| --- | --- | --- |
| `api_key_ciphertext` | LEGACY | Written by `upsert-whatsapp-config`; read by `test-whatsapp-config`. |
| `WHATSAPP_ENCRYPTION_KEY` | LEGACY | Read by both current WhatsApp Edge Functions. |
| `whatsapp_api_key` | LEGACY secret key | Excluded by the existing public settings boundary and blocked by `useSettings.ts`. |
| `whatsapp_base_url` | LEGACY metadata key | Referenced by the frontend contract; active row/value not proven. |
| `whatsapp_sender_number` | LEGACY metadata key | Referenced by the frontend contract; active row/value not proven. |
| `whatsapp_provider` | LEGACY metadata key | Referenced by the frontend contract; active row/value not proven. |
| `whatsapp_enabled` | LEGACY metadata key | Referenced by the frontend contract; active row/value not proven. |
| `vault_secret_id` | TARGET | Proposed application reference only; absent from the baseline. |

The browser reads `public_system_settings` through `useSettings.ts`. The
existing boundary excludes `whatsapp_api_key` but does not consistently exclude
all WhatsApp metadata keys. The generic settings mutation can write arbitrary
non-secret keys, although the WhatsApp UI currently saves through the Edge
Function. This legacy path must be retired at cutover, not deleted in the
foundation migration.

## Target schema contract

The future table is a singleton global metadata table:

```text
public.private_whatsapp_settings
  id              uuid primary key
  singleton_key   text not null unique check (singleton_key = 'default')
  provider        text not null
  api_base_url    text
  sender_number   text
  enabled         boolean not null default false
  vault_secret_id uuid unique
  created_at      timestamptz not null default now()
  updated_at      timestamptz not null default now()
  updated_by      uuid references public.profiles(id)
```

The table contains no API key, ciphertext, decrypted value, encryption key,
authorization header, or provider payload. `vault_secret_id` is nullable while
configuration is unconfigured, unique to prevent two rows referencing one
secret, and validated only by authorized server code. No SQL foreign key into
the managed `vault.secrets` relation is proposed.

The fixed `singleton_key = 'default'` constraint is the database-enforced
one-configuration rule. It is preferable to the current unbounded `.limit(1)`
lookup.

## RLS and public boundary

The private table receives no direct grants to `anon` or `authenticated`.
Edge Functions use service-role access only after resolving the caller and
requiring `admin_provinsi`. The client cannot provide a configuration UUID or
Vault UUID.

The frontend contract selects **Option A: Edge Function response**, not a
public view. This keeps the private table and Vault reference outside the
browser-facing data path and matches the existing authenticated function
boundary. A future read operation should return only:

```json
{
  "provider": "meta",
  "api_base_url": "...",
  "sender_number": "...",
  "enabled": false,
  "configured": true
}
```

No `vault_secret_id` is returned. A public metadata view is therefore not
required for the canonical cutover. If a view is later chosen, it must be
security-invoker, contain only the same safe fields, and never expose the
reference or secret material.

## Vault contract

### Create

```text
authenticate
-> authorize admin_provinsi
-> validate metadata and ephemeral key input
-> read the singleton row server-side
-> vault.create_secret(key, deterministic non-sensitive name, description, NULL)
-> persist returned UUID and metadata
-> return sanitized metadata/configured state
```

The secret name is `afp-whatsapp-config-<configuration UUID>`. The client
cannot choose it or the Vault UUID.

### Rotation

Metadata-only updates do not call Vault. A key update uses
`vault.update_secret()` against the server-derived `vault_secret_id`; it never
accepts an arbitrary client reference and never creates a second secret.

### Disable

`enabled = false` disables provider use but retains the Vault reference and
secret. Re-enabling does not require another key entry.

### Revoke

`DEFERRED — VAULT SECRET DELETION LIFECYCLE`. No public delete function was
verified, and the product has no current revoke workflow. This migration must
not add destructive deletion.

## Consistency model

Vault and Postgres are not one transaction.

### First create

The safe order is Vault create followed by metadata insert, because storing a
reference before the secret exists is invalid. If the insert fails, the system
must not claim success. The runtime has no verified public delete function, so
there is no currently approved automatic compensation. The failure must be
surfaced as an orphan-reconciliation condition, with the UUID retained only in
restricted server diagnostics if approved. This is a critical implementation
blocker, not an atomicity claim.

### Existing rotation

The application reference remains the same, so metadata persistence does not
depend on changing the reference. Perform Vault rotation first, then update
metadata only if needed. If the metadata update fails, the existing reference
still identifies the rotated secret; retry is safe. No cross-system rollback
is claimed.

## Audit contract

Reuse `public.audit_logs`. Use the existing non-null configuration `id` as
`entity_id` and record actions such as:

- `WHATSAPP_CONFIG_CREATED`
- `WHATSAPP_CONFIG_UPDATED`
- `WHATSAPP_CONFIG_ROTATED`
- `WHATSAPP_CONFIG_ENABLED`
- `WHATSAPP_CONFIG_DISABLED`

`old_data`, `new_data`, and `metadata` may contain only provider metadata and
state flags. They must never contain API keys, ciphertext, Vault values,
request bodies, headers, or raw provider errors.

Reuse `public.update_updated_at_column()`. Do not create `set_updated_at()`.

## Legacy migration contract

The current format is statically known: the Edge Function derives a 32-byte
AES key by padding/truncating `WHATSAPP_ENCRYPTION_KEY`, generates a 12-byte IV,
prepends the IV to AES-GCM ciphertext, and base64-encodes the result. The
decrypting Edge Function reverses that format server-side.

The future migration would be:

```text
server-only read of legacy ciphertext
-> server-only decrypt using verified production key availability
-> Vault create_secret()
-> persist vault_secret_id
-> backend verification
-> disable legacy reads/writes
-> retire key and ciphertext only after evidence
```

The contract is not yet safe to approve because production key availability,
legacy row existence, and the no-key fallback behavior cannot be verified
without production access. The current code returns plaintext unchanged when
`WHATSAPP_ENCRYPTION_KEY` is absent, which must be treated as an unsafe legacy
state and blocked during migration.

No production secret values were inspected.

## Migration phasing

### Foundation

- create the singleton metadata table with `vault_secret_id`
- add constraints and indexes
- enable RLS with no browser access
- add the Edge Function-only metadata contract
- do not drop ciphertext or legacy settings

### Application cutover

- update Edge Functions to use Vault
- add a server-side metadata read contract
- update `Settings.tsx` to consume sanitized metadata
- clear ephemeral key input after submission
- stop generic legacy WhatsApp settings writes

### Existing secret migration

- only after a production-safe key/state inventory is approved
- decrypt only inside trusted server execution
- create Vault secret and persist reference
- verify before disabling legacy reads

### Retirement

- disable legacy ciphertext reads/writes
- retire `WHATSAPP_ENCRYPTION_KEY`
- remove `api_key_ciphertext` only after migration evidence
- preserve historical migrations unchanged

## Security test contract

The implementation phase must cover unauthorized and non-admin callers,
admin success, arbitrary configuration/Vault UUID rejection, cross-user and
cross-region access attempts, singleton duplication, metadata-only updates,
rotation, disabled configuration, sanitized responses, sanitized logs, and
absence of secret material in application tables and audit payloads.

## Risks

- The proposed table is not current schema and must not be assumed present.
- Existing public settings filtering is incomplete for non-secret WhatsApp
  metadata keys.
- Vault/Postgres create is not atomic and automatic compensation is unresolved.
- Legacy production state and encryption-key availability are unverified.
- The current implementation has an unsafe plaintext fallback when the
  encryption key is absent.

## Execution status

- SQL executed: **NO**
- migration created: **NO**
- migration executed: **NO**
- production accessed: **NO**
- production modified: **NO**
- real WhatsApp credential used: **NO**
- provider contacted: **NO**

## Final gate

**BLOCKED — LEGACY SECRET MIGRATION CONTRACT INCOMPLETE**