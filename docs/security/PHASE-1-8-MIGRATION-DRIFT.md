# Phase 1.8 Migration Drift Audit

## Project identity

Linked project: `xfscfjwapwnkiinkgbjg` (`AFP SULSEL`), active/healthy, PostgreSQL `17.6.1.063`.

## Verified drift evidence

`supabase migration list --linked` connected to the remote database and displayed all 55 local migration versions with an empty Remote column. Therefore the repository migration ledger does not document the connected database as having applied those versions.

Classification: **DANGEROUS DRIFT / UNKNOWN LINEAGE** until the actual catalog is compared with the local SQL and a trusted schema source.

## What is not yet verified

- extra or missing tables/columns/types;
- actual role enum values and assignments;
- actual RLS flags and policies;
- function definitions, owners, search paths, and privileges;
- views, triggers, constraints, indexes, grants, and extensions;
- whether the database was created outside this repository or migration ledger.

A schema-only public dump was requested to a temporary path outside the repository. It was not complete at report preparation time.

## Safety decision

Do not run `db pull`, `db push`, migration repair, reset, or any write command during this forensic audit. The active project cannot be treated as an approved canonical schema source until the catalog is captured and environment classification is established.
