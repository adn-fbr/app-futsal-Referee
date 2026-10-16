# PRODUCTION RELEASE PLAN v1.0.0 — AFP SULSEL

## Gate

**BLOCKED — NO PRODUCTION MUTATION AUTHORIZED**

## Target

- Production project: `xfscfjwapwnkiinkgbjg`
- Production name: AFP SULSEL
- Production region: ap-southeast-2
- Non-Production source: `shorsqyycpptxcutrqrb`

## Current Evidence

- Canonical offline baseline hash: `b77b6cf72482a3401a7abd0a097f24587b6b78e88bbf1c6a816f1f1c9ed98db1`
- Offline baseline catalog: 27 tables, 249 columns, 47 functions, 86 policies, 47 indexes, 22 triggers, 7 extensions, 2 enum types
- Baseline dependency graph: 47 unresolved dependencies, 22 external managed dependencies
- Live Production catalog: NOT RE-READ in this phase
- Linked CLI target: Non-Production, not Production

## Expected Changes

No Production migrations are approved for execution in this phase.

The proposed RLS migration is not releasable because it has not been applied and validated in Non-Production. The annual reporting UI is a preview implementation; official issued reports, immutable snapshots, QR validation, and report history have a documented schema gap.

## Blocking Gates

- Target/catalog live verification: BLOCKED
- Migration reconciliation: BLOCKED by remote-only migration history (`20260908085000`, `20260908193235`, `20260908200857`)
- RLS review: BLOCKED; cross-region leakage remains pre-remediation
- Application compatibility: BLOCKED for official annual issuance
- Rollback: NOT APPROVED for an unapplied release

## Forbidden Actions

Do not use `db reset`, `migration repair`, `--include-all`, destructive baseline replay, ad-hoc Production SQL, fake data, or service-role frontend configuration.

## Required Before Release

1. Restore a project-scoped SQL channel.
2. Apply and validate the approved RLS policy migration in Non-Production.
3. Prove Admin Kab/Kota cross-region SELECT/UPDATE denial and `WITH CHECK` escape protection.
4. Reconcile migration provenance deterministically.
5. Define and authorize canonical report persistence before official annual report issuance.
6. Refresh and compare the live Production catalog read-only.
7. Produce a new approved release plan with all gates PASS.
