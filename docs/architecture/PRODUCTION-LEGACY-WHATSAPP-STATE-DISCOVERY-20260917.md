# Production Legacy WhatsApp State Discovery

## Phase

Production legacy WhatsApp state discovery - read only.

## Production target

- project name: AFP SULSEL
- project ref: `xfscfjwapwnkiinkgbjg`
- target verified: **PASS**

The authenticated `supabase projects list` command explicitly returned
`xfscfjwapwnkiinkgbjg` as AFP SULSEL. It also showed the currently linked
repository project `shorsqyycpptxcutrqrb` as the separate test project.

## Read-only safety

No production table query was executed. The repository remains linked to the
test project. A temporary production-ref-only CLI context was created locally
for a dry run, but `supabase db dump --linked --schema public --dry-run` stopped
before connection because this CLI requires project link state. The available
`supabase link` route requires the remote Postgres password, which is not
available through a safe non-secret mechanism in this environment.

Therefore production read-only database access was not proven and the stop
condition applies.

- production accessed: **NO**
- production modified: **NO**
- SQL read-only queries: **0**
- SQL mutations: **0**
- migrations executed: **0**
- DDL executed: **0**
- DML executed: **0**

## Static legacy model

Repository-only inspection confirms:

- legacy algorithm: AES-GCM;
- key source: `WHATSAPP_ENCRYPTION_KEY`;
- IV: 12 random bytes;
- storage format: IV plus ciphertext/authentication tag;
- encoding: base64;
- legacy field: `api_key_ciphertext`;
- missing or whitespace-only key: fail-closed after the prior local remediation.

No production values, ciphertext, environment secret, or decrypted value was
read.

## Production legacy state

Because no production table query was executed:

- `public.system_settings` exists: **UNKNOWN**
- WhatsApp-related configuration found: **UNKNOWN**
- secret-bearing configuration found: **UNKNOWN**
- configuration count: **UNKNOWN**
- enabled/active state: **UNKNOWN**
- source category: **UNKNOWN**
- `private_whatsapp_settings` exists: **UNKNOWN**
- `api_key_ciphertext` column exists: **UNKNOWN**
- ciphertext-bearing row count: **UNKNOWN**
- `WHATSAPP_ENCRYPTION_KEY` configured: **UNKNOWN**

Local baseline absence is not substituted for production evidence.

## Vault and provider safety

- Vault create operations: **0**
- Vault update operations: **0**
- Vault delete operations: **0**
- Vault secret reads: **0**
- decrypted secret reads: **0**
- provider contacted: **NO**
- real credential used: **NO**
- API key exposed: **NO**
- ciphertext exposed: **NO**
- plaintext extracted: **NO**
- encryption key exposed: **NO**
- secret-bearing logs created: **NO**

## Production legacy state

- category: **UNKNOWN**
- evidence: production project identity was verified, but production
  read-only database access was not established;
- uncertainty: all production schema, row existence, population, and runtime
  secret-availability questions remain unresolved.

## Final decision

Production legacy WhatsApp state cannot be classified without a verified
read-only database connection.

## Final gate

**BLOCKED — PRODUCTION TARGET OR READ-ONLY ACCESS NOT VERIFIED**