# CODEBASE INVENTORY

## Executive Summary

This repository is a Vite + React + TypeScript front end using Supabase as the backend and data layer. The production-facing application is centered in [src/App.tsx](../../src/App.tsx), [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx), and a large set of hooks under [src/hooks](../../src/hooks). The actual server logic is not in a Node backend; it is primarily Supabase database objects, edge functions under [supabase/functions](../../supabase/functions), and client-side calls to the Supabase client in [src/integrations/supabase/client.ts](../../src/integrations/supabase/client.ts).

## Repository Top-Level Inventory

- App shell: [package.json](../../package.json), [vite.config.ts](../../vite.config.ts), [tsconfig.json](../../tsconfig.json)
- Frontend source: [src](../../src)
- Database + auth + policies: [supabase](../../supabase)
- Static/public assets: [public](../../public)
- Runtime config: [.env](../../.env)
- Test files: [src/test](../../src/test)
- Legacy/temporary files: many folders under workspace root such as `tmpclaude-*`, not part of a production app contract

## Entry Points

- Web app entry: [src/main.tsx](../../src/main.tsx)
- App router: [src/App.tsx](../../src/App.tsx)
- Auth provider: [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- Supabase client bootstrap: [src/integrations/supabase/client.ts](../../src/integrations/supabase/client.ts)
- App build: [vite.config.ts](../../vite.config.ts)

## Frontend Architecture

### UI structure

- Pages under [src/pages](../../src/pages)
- Layouts and reusable UI under [src/components](../../src/components)
- Shared logic under [src/hooks](../../src/hooks)
- Domain routing/guards under [src/lib](../../src/lib)
- Auth state under [src/contexts](../../src/contexts)

### Route protection model

The app uses a custom route guard in [src/components/auth/ProtectedRoute.tsx](../../src/components/auth/ProtectedRoute.tsx). It checks:

- `user`
- `isLoading`
- `role`
- `isProfileComplete`
- `registrationStatus`
- `requireRole`, `requireAdmin`, `requireProfileComplete`

The route map is embedded in [src/App.tsx](../../src/App.tsx) and declares a large number of protected pages for admin, panitia, wasit, evaluator, and public routes.

## Backend / Data Layer

### Supabase setup

The actual backend implementation is in the Supabase project:

- client config: [src/integrations/supabase/client.ts](../../src/integrations/supabase/client.ts)
- generated types: [src/integrations/supabase/types.ts](../../src/integrations/supabase/types.ts)
- migrations: [supabase/migrations](../../supabase/migrations)
- edge functions: [supabase/functions](../../supabase/functions)
- config: [supabase/config.toml](../../supabase/config.toml)

### Critical backend services identified

- User creation: [supabase/functions/create-user/index.ts](../../supabase/functions/create-user/index.ts)
- User deletion: [supabase/functions/delete-user/index.ts](../../supabase/functions/delete-user/index.ts)
- Bulk import/export: [supabase/functions/import-database/index.ts](../../supabase/functions/import-database/index.ts), [supabase/functions/export-database/index.ts](../../supabase/functions/export-database/index.ts)
- Notifications: [supabase/functions/send-assignment-notification/index.ts](../../supabase/functions/send-assignment-notification/index.ts)
- Database seeding: [supabase/functions/seed-database/index.ts](../../supabase/functions/seed-database/index.ts)

## Database Inventory

From migrations and generated types, the main tables include:

- `profiles`
- `user_roles`
- `events`
- `event_assignments`
- `event_approvals`
- `honors`
- `provinsi`
- `kabupaten_kota`
- `pengurus`
- `audit_logs`
- `learning_materials`
- `learning_progress`
- `discussion_topics`
- `discussion_replies`
- `system_settings`
- `evaluations`
- `evaluation_criteria`
- `evaluation_scores`
- `referee_cards`
- `notifications`
- `notification_preferences`
- `auth_event_logs`

## Authentication and Authorization

### Auth library

- Supabase Auth is the auth provider via `@supabase/supabase-js`.
- Session handling occurs in [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx).

### Role model

Roles are centralized to a TypeScript union and DB-backed user_roles rows:

- `admin_provinsi`
- `admin_kab_kota`
- `panitia`
- `wasit`
- `evaluator`

The role access model is enforced in frontend route guards and partially in database policies.

## State Management

- TanStack Query is used heavily for server data sync: [src/hooks](../../src/hooks)
- React Context is used for auth and notification state
- Local component state is used widely in pages and dialogs

## Testing Inventory

- Test infrastructure exists via Vitest in [vitest.config.ts](../../vitest.config.ts)
- Example smoke test in [src/test/example.test.ts](../../src/test/example.test.ts)
- No meaningful production test suite was found for auth, authorization, match engine, or security-critical flows.

## Data and Config Observations

### Documentation mismatch

The repository README is generic Lovable boilerplate and does not reflect live application domains, tables, or production configuration. This is a concrete documentation mismatch relative to the actual app implementation.

### Production-risk observations

- The app structure is richer than a basic demo, but many critical business flows and security checks are split between client code and database policies.
- A large amount of logic is in hooks and pages, not in a clear service or domain layer.
- Some logic appears to be intentionally created for operational admin workflows, but there is no documented architecture boundary between app logic and database access.

## Repository Risk Summary

This is not a clean backend/frontend split. It is a hybrid architecture:

- frontend app shell and route governance in React
- secure user identity in Supabase Auth
- database logic and RLS enforcement in Postgres
- admin actions in edge functions
- operational workflows distributed across hooks and database functions

That architecture is usable, but it requires stronger explicit boundaries and verification if this project is intended to be production-safe.
