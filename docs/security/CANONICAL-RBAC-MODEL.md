# CANONICAL RBAC MODEL

## Purpose

This document defines the canonical role vocabulary that matches the application’s actual business domain and the current database/frontend role model, without inventing a whole new role taxonomy.

## Current observed role set

From the codebase and SQL migrations, the active role names are:

- `admin_provinsi`
- `admin_kab_kota`
- `panitia`
- `wasit`
- `evaluator`

Legacy values still appear in historical migrations:

- `admin`
- `referee`

## Canonical role interpretation

The current domain is best modeled as:

| Canonical role | Current app meaning | Scope | Typical resources |
| --- | --- | --- | --- |
| PLATFORM_ADMIN | `admin_provinsi` | Entire platform | user approval, global settings, system reporting |
| ORGANIZATION_ADMIN | `admin_kab_kota` | One region / organization scope | area-level user and event management |
| COMPETITION_OPERATOR | `panitia` | Event and organizer operations | event submission, assignment coordination |
| REFEREE | `wasit` | Individual referee operations | profile, assignments, honor, learning |
| EVALUATOR | `evaluator` | Evaluation and assessment role | evaluations, review workflows |

## Role mapping summary

| Role key | DB evidence | Frontend evidence | Policy evidence | Assessment |
| --- | --- | --- | --- | --- |
| `admin_provinsi` | migrations and `user_roles` | [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx), [src/App.tsx](../../src/App.tsx) | [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql) | Active |
| `admin_kab_kota` | migrations and `user_roles` | [src/App.tsx](../../src/App.tsx) | same migration file | Active |
| `panitia` | migrations and `user_roles` | [src/App.tsx](../../src/App.tsx) | same migration file | Active |
| `wasit` | migrations and `user_roles` | [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) | same migration file | Active |
| `evaluator` | migrations and `user_roles` | [src/App.tsx](../../src/App.tsx) | same migration file | Active |
| `admin` | legacy migration value | compatibility normalization | early migration logic | Legacy |
| `referee` | legacy migration value | compatibility normalization | early migration logic | Legacy |

## Role semantics to preserve

The actual domain semantics are not arbitrary. They align with a federation-type sports management model:

- platform-level admin governs system-wide control
- regional admin governs area-bound administrative operations
- panitia is a competition/event operator
- wasit is an assigned match official
- evaluator handles performance review and scoring

## Proposed canonical RBAC contract

For this phase, do not create a new DB enum immediately. Instead, define the canonical contract as a normalizing layer:

```text
PLATFORM_ADMIN = admin_provinsi
ORGANIZATION_ADMIN = admin_kab_kota
COMPETITION_OPERATOR = panitia
REFEREE = wasit
EVALUATOR = evaluator
```

This keeps the repository's real business language and avoids a destructive role rewrite before dependency analysis is complete.

## Risk note

The main risk is not role abundance itself. The risk is that the app currently relies on a mixed set of names and compatibility translations. Until the codebase is normalized, permission checks remain ambiguous.

## Decision

This phase will document and align on the real canonical role set above, without deleting legacy values in the database until the migration plan is explicitly approved.
