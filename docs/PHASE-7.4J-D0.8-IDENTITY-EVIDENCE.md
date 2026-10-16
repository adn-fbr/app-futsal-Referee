# PHASE 7.4J-D0.8 Identity Evidence

## Remote public tables

| Table | Exists | Columns | Rows | RLS | Policies | FK evidence |
|---|---:|---:|---:|---:|---:|---|
| `profiles` | YES | 12 | 0 | YES | 5 | `profiles.id -> auth.users.id` |
| `user_roles` | YES | 3 | 0 | YES | 2 | `user_roles.user_id -> auth.users.id` |
| `pengurus` | NO | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

The remote schema dump contains the externally managed `auth.users` relation and the expected profile/role foreign keys. Auth user count and identity data were not enumerated. No emails, identities, or PII were retrieved.

Identity schema is **PARTIAL** and identity data disposition remains **UNKNOWN**.