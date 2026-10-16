# CURRENT ARCHITECTURE

## 1. Actual Application Flow

The actual runtime architecture is effectively:

```text
User
  ↓
React UI (pages/components)
  ↓
Auth Provider + route guards
  ↓
TanStack Query hooks
  ↓
Supabase client / RPC / Edge Functions
  ↓
Postgres database
```

This differs from a classic layered architecture because UI code, business policy, and persistence logic are interleaved.

## 2. Evidence from the codebase

### Frontend route and auth gating

- [src/App.tsx](../../src/App.tsx): declares routes and role-based access
- [src/components/auth/ProtectedRoute.tsx](../../src/components/auth/ProtectedRoute.tsx): checks auth, role, profile completion, registration status
- [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx): loads auth session, user role, profile status

### Data access pattern

Most business logic is accessed through hooks such as:

- [src/hooks/useUsers.ts](../../src/hooks/useUsers.ts)
- [src/hooks/useEvents.ts](../../src/hooks/useEvents.ts)
- [src/hooks/useRegistrations.ts](../../src/hooks/useRegistrations.ts)
- [src/hooks/useEventAssignments.ts](../../src/hooks/useEventAssignments.ts)
- [src/hooks/useReferees.ts](../../src/hooks/useReferees.ts)

These hooks query Supabase directly and often combine query logic, validation, cache invalidation, and UI notifications in the same layer.

## 3. Architecture Observations

### Positive aspects

- Clear separation between pages and reusable UI components exists
- React Query centralizes server state and caching
- Supabase Auth and the database are used as the platform backend
- Route protection is implemented in one place
- Operational admin features are present and broad in scope

### Weaknesses and risks

#### a) Business logic is in UI-adjacent hooks

There is no clear domain service layer. Instead, queries, authorization checks, notifications, and mutation logic are spread across hook files. This reduces maintainability and increases chance of accidental logic drift.

#### b) Client-side authorization is still primary in many cases

Protected routes enforce access in React, but the codebase also relies heavily on DB queries that do not appear to be uniformly protected by server-side enforcement. Examples:

- [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- [src/hooks/useUsers.ts](../../src/hooks/useUsers.ts)
- [src/hooks/useRegistrations.ts](../../src/hooks/useRegistrations.ts)
- [src/pages/UserApprovals.tsx](../../src/pages/UserApprovals.tsx)

This can be safe only if Supabase RLS and edge function checks are strict and verified. The current code suggests a hybrid trust model.

#### c) Multiple role sources and migration history

The system has both:

- TypeScript role union in [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- SQL enum values and migrations under [supabase/migrations](../../supabase/migrations)

This creates an architecture risk: role semantics have evolved over time (`admin`, `referee`, `admin_provinsi`, etc.).

#### d) Permission logic is partly encoded in UI and partly in database

The database has many RLS policies that use `public.is_admin(auth.uid())`, `public.has_role(...)`, and region checks. Meanwhile the frontend still checks `'if (!role)'` and `requireRole` arrays. This is a classic production risk when multi-layer checks are not consistently aligned.

#### e) Hard-coded business assumptions exist

Examples include:

- role assignment logic in [src/hooks/useRegistrations.ts](../../src/hooks/useRegistrations.ts)
- app redirect logic in [src/lib/routeUtils.ts](../../src/lib/routeUtils.ts)
- custom approval pages such as [src/pages/UserApprovals.tsx](../../src/pages/UserApprovals.tsx)

These assumptions are acceptable for a narrow domain, but do not yet look like a centralized business rules engine.

## 4. Coupling and Cohesion Assessment

### Coupling

- High coupling between pages and database access hooks
- High coupling between UI and role logic
- High coupling between route definitions and business permission checks

### Cohesion

- Domain concepts are spread across many hooks and pages rather than organized into service / domain packages
- There is a clear app domain (referee management, assignments, evaluations, approvals), but not a clean boundary around it

## 5. Architectural Diagnosis

The architecture is best described as an operational dashboard application built on top of Supabase rather than a strict layered domain-driven application.

This is workable for a production MVP, but it is not yet a stable platform architecture because:

- authorization is not fully centralized
- business logic is duplicated across UI and DB
- data integrity rules are not explicitly modeled as domain services
- migration history suggests iterative schema evolution rather than a fully designed canonical model

## 6. Recommended Target Architecture

The target architecture should be:

```text
UI Layer
  ↓
Application Services / hooks
  ↓
Domain Services (authorization + workflow rules)
  ↓
Repository / Database Access
  ↓
Supabase Postgres + RLS + Edge Functions
```

Key rule: client code should never be the only authorization boundary.

## 7. Conclusion

The current architecture is usable and feature-rich, but it is a hybrid production application with elevated risk if exposed without hardening. It should not be treated as a fully mature platform architecture yet.
