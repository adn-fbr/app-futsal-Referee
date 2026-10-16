# Legacy WhatsApp State Discovery

Status: read-only discovery. Production was not accessed. No SQL, migration,
Vault operation, provider request, or secret decryption was performed.

## Static legacy model

The legacy implementation is present in:

- `supabase/functions/upsert-whatsapp-config/index.ts`
- `supabase/functions/test-whatsapp-config/index.ts`
- `src/hooks/useSettings.ts`
- `src/pages/Settings.tsx`

The encryption format is:

- algorithm: AES-GCM
- key input: `WHATSAPP_ENCRYPTION_KEY`
- key normalization: UTF-8 environment value padded with `0` or truncated to
  32 bytes
- IV/nonce: 12 random bytes
- authentication tag: supplied by the Web Crypto AES-GCM implementation and
  included in the ciphertext result
- encoding: IV concatenated with ciphertext/tag, then base64 encoded
- storage target: `private_whatsapp_settings.api_key_ciphertext`

The code has an unsafe fallback:

- `upsert-whatsapp-config.encryptSecret()` returns the plaintext unchanged if
  `WHATSAPP_ENCRYPTION_KEY` is absent;
- the returned value is then written to `api_key_ciphertext`;
- `test-whatsapp-config.decryptSecret()` also returns its input unchanged when
  the key is absent.

This fallback is reachable through the normal authenticated configuration
request path and can persist plaintext if the environment secret is missing.
It is not a migration-only compatibility path.

## Current system settings evidence

The canonical baseline statically proves the `public.system_settings` table,
with columns `id`, `key`, `value`, `description`, `updated_by`, `created_at`,
and `updated_at`. The existing public settings boundary excludes
`whatsapp_api_key` but does not consistently exclude all WhatsApp metadata
keys.

Repository references classify the keys as follows:

| Key | Classification | Read/write evidence |
| --- | --- | --- |
| `whatsapp_api_key` | secret legacy key | Excluded from public settings and blocked by `useSettings.ts`; no value read. |
| `whatsapp_base_url` | non-secret legacy metadata | Frontend hydration reference; active database row not verified. |
| `whatsapp_sender_number` | non-secret legacy metadata | Frontend hydration reference; active database row not verified. |
| `whatsapp_provider` | non-secret legacy metadata | Frontend hydration reference; active database row not verified. |
| `whatsapp_enabled` | non-secret legacy metadata | Frontend hydration reference; active database row not verified. |

The generic settings hooks read `public_system_settings`. Bulk writes exclude
only keys in `SECRET_SETTING_KEYS`, which includes `whatsapp_api_key` but not
the four metadata keys. The WhatsApp UI currently submits configuration to the
Edge Function instead of saving these legacy keys directly.

## Production state

Production project: `xfscfjwapwnkiinkgbjg`.

Production read-only database access was not established in this phase. No
production connection was attempted because the available verified runtime is
the isolated local project `shorsqyycpptxcutrqrb`, and local evidence cannot be
substituted for production evidence.

Therefore:

- legacy system settings present: **UNKNOWN**
- legacy ciphertext table present: **UNKNOWN**
- legacy ciphertext populated: **UNKNOWN**
- number of configurations: **UNKNOWN**
- active/enabled state: **UNKNOWN**
- production `WHATSAPP_ENCRYPTION_KEY` configured: **UNKNOWN**
- source category: **UNKNOWN**

The repository evidence says `private_whatsapp_settings` is absent from the
canonical baseline, but that does not prove production state.

## Prohibited operations not performed

- no production SQL
- no `SELECT` of `system_settings.value`
- no `SELECT` of `api_key_ciphertext`
- no environment secret value inspection
- no AES-GCM decryption
- no Vault create, update, or delete
- no migration execution
- no provider request

## Fallback classification

- fallback exists: **YES**
- reachable: **YES**, through normal authenticated requests
- persists plaintext: **YES**, when the encryption key is absent and a key is submitted
- retirement required: **YES**

This is a security blocker for production cutover. The fallback must be removed
or made fail-closed before any production migration or legacy secret handling.

## Migration decision

The production state and production key availability remain unknown, so the
repository cannot determine whether migration is required. The fallback is
also demonstrably capable of plaintext persistence.

## Safety

- production accessed: **NO**
- production modified: **NO**
- secret values retrieved: **NO**
- ciphertext retrieved: **NO**
- secret values logged: **NO**
- Vault secret created: **NO**
- Vault secret modified: **NO**
- provider contacted: **NO**
- mutations executed: **0**
- migrations executed: **0**
- Vault operations: **0**

## Final gate

**BLOCKER — LEGACY PLAINTEXT FALLBACK REQUIRES RETIREMENT**