# Phase 1.8E Test Project Provisioning

## Discovery result

- Requested name: `AFP SULSEL SECURITY TEST`
- Existing dedicated project: **NOT FOUND**
- Existing preview branches for production: **NONE reported** (`supabase branches list` returned `null`)
- Production project: `xfscfjwapwnkiinkgbjg` (`AFP SULSEL`), active/healthy
- Unrelated accessible project: `ID CARD`, inactive; not suitable for this application

No project was created. Infrastructure authorization and creation credentials were not provided.

## Provisioning specification

| Field | Required value |
| --- | --- |
| Name | `AFP SULSEL SECURITY TEST` |
| Environment | TEST / NON-PRODUCTION |
| Purpose | Behavioral security testing |
| Production relationship | None; isolated project |
| Production data | None |
| Production Auth users | None |
| Production secrets | None |
| Region | Prefer `ap-southeast-2` where practical |
| Database | Supabase PostgreSQL, compatible with runtime PostgreSQL 17.6.1 |
| Auth | Separate synthetic Auth tenant/users |
| Edge Functions | Separate deployment and test-only secrets |

## Required owner action

Provision the project through the Supabase dashboard/authorized infrastructure workflow, record its new ref and URL in a protected secret manager, label it non-production, and provide access only to the test deployment identity.

The new ref must not equal `xfscfjwapwnkiinkgbjg`.
