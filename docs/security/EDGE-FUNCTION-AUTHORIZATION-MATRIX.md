# EDGE FUNCTION AUTHORIZATION MATRIX

## Phase 1.3 inventory

All functions listed in [supabase/config.toml](../../supabase/config.toml) have `verify_jwt = true`. All privileged handlers below now import the shared resolver from [supabase/functions/_shared/authorization.ts](../../supabase/functions/_shared/authorization.ts).

| Function | Purpose | Auth | Roles | Tenant/resource scope | Service role | Shared resolver | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `admin-reports` | Admin reporting | JWT | `admin_provinsi`, `admin_kab_kota` | Region filter constrained for regional admin | Yes | Yes | Hardened |
| `auto-complete-events` | Complete expired events | JWT | `admin_provinsi`, `admin_kab_kota` | Event workflow | Yes | Yes | Hardened |
| `create-user` | Create user | JWT | `admin_provinsi` | Global admin operation | Yes | Yes | Hardened |
| `create-users-bulk` | Bulk user creation | JWT | `admin_provinsi` | Global admin operation | Yes | Yes | Hardened |
| `delete-user` | Delete user | JWT | `admin_provinsi` | Target user protections remain | Yes | Yes | Hardened |
| `export-database` | Export data | JWT | `admin_provinsi` | Global export | Yes | Yes | Hardened |
| `generate-report-pdf` | Generate report PDF | JWT | `admin_provinsi`, `admin_kab_kota`, `evaluator` | Payload scope still requires live validation | User client + service resolver | Yes | Partial |
| `import-database` | Import data | JWT | `admin_provinsi` | Imported tenant fields require DB validation | Yes | Yes | Hardened |
| `reset-user-password` | Reset password | JWT | `admin_provinsi` | Target user | Yes | Yes | Hardened |
| `seed-database` | Seed data | JWT | `admin_provinsi` | Global operation | Yes | Yes | Hardened |
| `send-assignment-notification` | Assignment email | JWT | `admin_provinsi`, `admin_kab_kota`, `panitia` | Event region/owner | Yes | Yes | Hardened |
| `send-event-notification` | Event email | JWT | `admin_provinsi`, `admin_kab_kota`, `panitia` | Event scope requires live validation | Yes | Yes | Partial |
| `send-event-reminders` | Reminder batch | JWT | `admin_provinsi`, `admin_kab_kota`, `panitia` | Region or event owner | Yes | Yes | Hardened |
| `send-license-reminder` | License reminder batch | JWT | `admin_provinsi` | Global referee dataset | Yes | Yes | Blocked for scheduler contract |
| `send-profile-reminder` | Profile reminder batch | JWT | `admin_provinsi`, `admin_kab_kota` | User IDs require regional validation | Yes | Yes | Partial |
| `test-email-config` | Test email | JWT | `admin_provinsi` | Global system settings | Yes | Yes | Partial due secret storage |
| `update-user-email` | Update Auth email | JWT | `admin_provinsi`, `admin_kab_kota` | Target region validation remains | Yes | Yes | Partial |

## Security rules

- Client-provided `user_id`, `role`, and tenant fields are inputs only, never identity authority.
- Identity is resolved from the verified Supabase Auth bearer token.
- Role is resolved from `user_roles`.
- Region scope is resolved from `profiles.kabupaten_kota_id`.
- Frontend route guards remain UX controls only.

## Verification status

The complete function inventory passes Deno type-checking. Real authorization and tenant behavior remains unverified until a local or dedicated non-production Supabase database is available.
