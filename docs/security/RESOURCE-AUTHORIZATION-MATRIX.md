# RESOURCE AUTHORIZATION MATRIX

## Scope

This matrix records the server-side resource decision for all 17 privileged Edge Functions. JWT authentication alone is not treated as authorization.

| Function | Input resource | Resource tenant/scope | Caller role | Permission decision | Status |
| --- | --- | --- | --- | --- | --- |
| `admin-reports` | report filters | `kabupaten_kota_id` filter | `admin_provinsi`, `admin_kab_kota` | Regional admin filter must equal resolved caller tenant; province admin is global | PASS static |
| `auto-complete-events` | event batch | event workflow; tenant validation still DB-dependent | `admin_provinsi`, `admin_kab_kota` | Admin role required before mutation | PARTIAL |
| `create-user` | new profile/role | submitted tenant for created user | `admin_provinsi` | Global admin only; role/tenant payload is validated as input | PARTIAL |
| `create-users-bulk` | new profiles/roles | submitted region values | `admin_provinsi` | Global admin only; bulk payload does not establish caller identity | PARTIAL |
| `delete-user` | target `user_id` | target profile | `admin_provinsi` | Self-delete and peer-admin protections; global admin operation | PARTIAL |
| `export-database` | selected tables | global export | `admin_provinsi` | Global export permission | PASS static |
| `generate-report-pdf` | report payload | client payload; no resource lookup | `admin_provinsi`, `admin_kab_kota`, `evaluator` | Role gate exists; resource scope requires domain-specific validation | PARTIAL |
| `import-database` | imported records | imported tenant fields | `admin_provinsi` | Global import permission; imported row scope requires live DB validation | PARTIAL |
| `reset-user-password` | target `user_id` | target auth user | `admin_provinsi` | Global admin permission; target safety requires live validation | PARTIAL |
| `seed-database` | seed batch | global system operation | `admin_provinsi` | Province admin only | PASS static |
| `send-assignment-notification` | `assignment_id`/`event_id` | event tenant and owner | `admin_provinsi`, `admin_kab_kota`, `panitia` | Event tenant and panitia ownership checked before email | PASS static |
| `send-event-notification` | `event_id` | event `kabupaten_kota_id` | `admin_provinsi`, `admin_kab_kota`, `panitia` | Event tenant and panitia ownership checked | PASS static |
| `send-event-reminders` | event batch | event region or creator | `admin_provinsi`, `admin_kab_kota`, `panitia` | Results filtered by resolved tenant/owner | PASS static |
| `send-license-reminder` | license batch | global referee dataset | `admin_provinsi` | Admin gate exists; scheduler caller contract unresolved | BLOCKED scheduler |
| `send-profile-reminder` | target `userIds` | target profile region | `admin_provinsi`, `admin_kab_kota` | Regional target query constrained to caller tenant | PASS static |
| `test-email-config` | email configuration | global settings | `admin_provinsi` | Admin gate; secrets read from environment | PASS static |
| `update-user-email` | target `user_id` | target profile region | `admin_provinsi`, `admin_kab_kota` | Regional admin target profile must match caller tenant | PASS static |

## Canonical decision chain

```text
verified JWT
  -> authenticated user
  -> user_roles role
  -> profiles.kabupaten_kota_id tenant
  -> target resource tenant/owner
  -> role permission
  -> operation
```

## Known limitations

The matrix contains static implementation evidence. RLS and resource behavior must still be validated against a running non-production database. The `generate-report-pdf` payload is not a database-backed resource operation and requires an explicit product decision for report scope before it can be considered fully closed.
