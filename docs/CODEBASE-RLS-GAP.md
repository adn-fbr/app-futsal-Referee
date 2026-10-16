# RLS Gap Analysis

## Evidence boundary

No remote database was queried in this analysis. Prior offline evidence for `shorsqyycpptxcutrqrb` reports 86 policies with no normalized mismatches, but Phase 8.3E assignment RLS tests were not executed. Therefore current module classifications are `RLS UNCERTAIN` unless supported only by static governance evidence.

## Module impact

- Auth/Profile/Role: static repository and route contracts present; runtime policy behavior unverified.
- Events/Approvals: direct table and RPC access; tenant/role policy behavior needs integration tests.
- `event_assignments`: critical; Admin Provinsi pending-to-confirmed update, non-admin denial, anonymous denial, and unchanged foreign keys are unverified.
- Discussions: `increment_view_count` is a schema gap; RLS cannot be considered aligned with an object absent from canonical inventory.
- Settings: `public_system_settings` is historical/noncanonical; policy/object behavior is blocked.
- Export/import/user Edge Functions: server-side authorization and service-role boundaries require function integration tests.

## Required test matrix

| Identity | Read assignment | Update authorized pending row | Expected source |
|---|---|---|---|
| Admin Provinsi | contract-dependent | allowed only for authorized row/transition | approved Non-Production fixture + RLS |
| Non-admin | contract-dependent | denied | role/RLS test |
| Anonymous | denied unless explicitly public | denied | Auth/RLS test |

No policy, schema, SECURITY DEFINER function, or grant should be changed as part of analysis. Current classification: **RLS UNCERTAIN / BLOCKED FOR LIVE PROOF**, not RLS mismatch.
