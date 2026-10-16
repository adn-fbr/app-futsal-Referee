# Phase 1.8D Test Environment Strategy

## Production status

Project `xfscfjwapwnkiinkgbjg` is confirmed by the owner as production/live. It is read-only for security reference. No fixtures, users, tests, migrations, or writes may target it.

## Options evaluated

| Option | Isolation | Fidelity | Cost | Security | Decision |
| --- | --- | --- | --- | --- | --- |
| Supabase Branch | High if isolated and access-controlled | High | Medium | High, but branch lifecycle/credentials must be verified | Viable alternative |
| Dedicated Supabase test project | Highest operational separation | High | Medium | Highest practical separation; independent Auth, DB, secrets, Edge Functions | **Recommended** |
| Local Supabase/PostgreSQL | High locally | Medium/High | Low | Strong local boundary, but image/version and deployment differences remain | Secondary validation |
| Dedicated staging | Medium/High | High | High | Requires strict data and credential separation | Acceptable if separately governed |

## Selected strategy

**Dedicated Supabase project: `AFP SULSEL SECURITY TEST`**, created and managed separately from production. It must use a distinct project ref, URL, database credentials, Auth users, Edge Function secrets, and deployment configuration.

This phase designs the environment only. It does not create the project automatically because infrastructure authorization was not provided.

## Safety properties

- Production project ref is deny-listed from test CI and fixture scripts.
- No production credentials or data are copied.
- Test project can be destroyed without production impact.
- Auth, RLS, PostgREST, RPC, storage, and Edge Function behavior remain Supabase-faithful.
- Test secrets are separate and synthetic.

## Required approval

An infrastructure owner must provision the test project, label it non-production, supply credentials through a secret manager, and approve deployment of the schema-only baseline and test Edge Functions.
