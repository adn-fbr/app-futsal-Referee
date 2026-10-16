# Phase 8.5 Event Workflow

```mermaid
flowchart TD
  A[Admin Provinsi authenticated] --> B[Create Event form]
  B --> C{Past date?}
  C -->|yes, Admin Provinsi| D[Historical indicator]
  C -->|future/today| E[Normal date]
  D --> F[Create canonical events row with DIAJUKAN]
  E --> F
  F --> G[Existing event_approvals pending record]
  G --> H[Existing Admin Provinsi approval/validation path]
  H --> I[DISETUJUI using existing status contract]
  I --> J[Existing referee availability/search]
  J --> K[event_assignments]
  K --> L[pending -> confirmed existing workflow]
  L --> M[Revalidation/audit/notification validation]
```

## Implemented in this phase

Only the date-picker rule and Historical Event indicator. Existing status, approval, assignment, step-up, and RLS boundaries were reused; no new status, RPC, table, or field was created.

## Unverified

Remote authorization, RLS, duplicate prevention, audit, notification, and post-mutation persistence require approved Non-Production fixtures.
