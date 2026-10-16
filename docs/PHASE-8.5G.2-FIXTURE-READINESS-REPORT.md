# PHASE 8.5G.2
# NON-PRODUCTION SYNTHETIC AUTH & EVENT ASSIGNMENT FIXTURE READINESS

## STATUS

**BLOCKED - NON-PRODUCTION SYNTHETIC FIXTURE READINESS BLOCKED**

## TARGET

- Environment: NON-PRODUCTION
- Project ID: `shorsqyycpptxcutrqrb`
- Production project: `xfscfjwapwnkiinkgbjg`
- Active config and Vite URL: Non-Production
- Production operations: 0

## FINDINGS

The canonical application role is `admin_provinsi`. Generated types confirm the required relationships:

- `events.created_by -> profiles.id`
- `events.kabupaten_kota_id -> kabupaten_kota.id`
- `event_assignments.event_id -> events.id`
- `event_assignments.referee_id -> profiles.id`

The existing fixture script is intentionally protected and requires `SUPABASE_SERVICE_ROLE_KEY`, `TEST_ENVIRONMENT=non-production`, approved tenant IDs, and approved user IDs. None of those provisioning prerequisites are available in the current environment. No Auth user, profile, role, event, region, or assignment was created.

## REQUIRED INPUT TO UNBLOCK

Provide an approved Non-Production Auth creation mechanism or existing synthetic identities, plus fixture-scoped IDs and a temporary password through an approved local secret channel. Do not put credentials in this repository or artifacts. Provisioning must then be idempotent and fixture-scoped.

## INVARIANTS

- Production queries: 0
- Production mutations: 0
- Production Auth operations: 0
- Production Storage operations: 0
- Production schema changes: 0
- Production RLS changes: 0
- Production deployments: 0
- Non-Production Auth creations: 0
- Non-Production data mutations: 0
- Schema changes: 0
- RLS changes: 0
- Migrations created/applied: 0

Status mutation validation was not performed, as required by this phase. No status validation or application redesign was performed.

## FINAL GATE

**BLOCKED - NON-PRODUCTION SYNTHETIC FIXTURE READINESS BLOCKED**

Not ready for `PHASE 8.5G.1 - NON-PRODUCTION EVENT ASSIGNMENT STATUS VALIDATION` because the required synthetic Auth and data fixture does not exist.
