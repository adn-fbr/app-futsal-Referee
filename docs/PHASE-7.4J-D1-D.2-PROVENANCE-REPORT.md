# PHASE 7.4J-D1-D.2 - CANONICAL BASELINE PROVENANCE RECONCILIATION

## Phase
PHASE 7.4J-D1-D.2

## Scope
Read-only filesystem and Git provenance investigation for `production-schema.sql`.
No reconstruction, migration execution, database access, database mutation, or canonical baseline modification was performed.

## Production safety boundary
Production project `xfscfjwapwnkiinkgbjg` was not accessed. Production SQL and production migration are forbidden in this phase.

## Current file
- Path: `production-schema.sql`
- Raw size: 126597 bytes
- Last write UTC: `2026-09-07T07:23:53.3207946Z`
- First bytes: `0A 0A 0A 53`
- Encoding evidence: UTF-8 text bytes; no UTF-8 BOM; mixed LF/CRLF line endings
- Current SHA-256: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`

## Expected hash
`b77b6cf72482a3401a7abd0a097f24587b6b78e88bbf1c6a816f1f1c9ed98db1`

The expected hash was not found in any committed Git tree. It appears in the pre-existing untracked D1-D1 investigation artifacts and in this phase's input context, but no authoritative baseline artifact or historical file with that hash was recovered.

## Observed hash
`b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`

The observed hash was independently reproduced before this phase and reproduced again by raw-byte hashing. `CANONICAL-RUNTIME-BASELINE.sql` is exactly byte-identical to the current file and has the same observed hash.

## Historical hashes
Git history contains one relevant file revision:

| Commit | Date | Ref | Raw Git blob bytes | Raw SHA-256 |
| --- | --- | --- | ---: | --- |
| `74dcc12efc1e46c38a5466bb0d2b04405009f535` | `2026-09-07T21:26:19+08:00` | `main` | 125722 | `d4599d721b11ee2510bdcc16f3ad19916a8ce2e802a5f9ee05b12701b6a38995` |

Neither the expected hash nor the observed hash is the raw SHA-256 of the historical Git blob. Git records the source as LF-only while the checked-out file is mixed line endings under `core.autocrlf=true`.

## Git provenance
- First commit introducing `production-schema.sql`: `74dcc12efc1e46c38a5466bb0d2b04405009f535`
- Latest commit modifying it: `74dcc12efc1e46c38a5466bb0d2b04405009f535`
- Tracked: yes, mode `100644`
- Ignored: no
- Branch containing the file revision: `main`
- Tags containing the file revision: none
- Working-tree `git diff -- production-schema.sql`: empty after Git newline normalization
- Staged `git diff --cached -- production-schema.sql`: empty
- `git ls-files --eol`: index `i/lf`, worktree `w/mixed`, no attributes
- Raw comparison with Git HEAD: first difference at byte offset 1422, line 93, column 10; 875 CRLF sequences are present in the current file
- SQL after LF normalization: equal to Git HEAD

## Candidate baselines
1. `production-schema.sql` is the current source and hashes to the observed value.
2. `CANONICAL-RUNTIME-BASELINE.sql` is 126597 bytes, byte-identical to the current source, and hashes to the observed value.
3. The only historical Git source is 125722 LF-only bytes with hash `d4599d721b11ee2510bdcc16f3ad19916a8ce2e802a5f9ee05b12701b6a38995`; it is semantically/textually equal after line-ending normalization and is not a candidate for either supplied hash.
4. No file matching the expected hash was recovered. No replacement or reconstruction was attempted.

## Artifact provenance
The committed baseline-generation artifacts record the observed hash and identify `production-schema.sql` as their source:

- `CANONICAL-RUNTIME-BASELINE-HASH.txt`
- `CANONICAL-RUNTIME-BASELINE-MANIFEST.json`
- `CANONICAL-RUNTIME-BASELINE-REPORT.md`
- `PRODUCTION-FULL-DEPENDENCY-GRAPH.json`
- `PRODUCTION-FULL-DEPENDENCY-MANIFEST.json`
- approved contract and phase reports through PHASE 7.4H

The generator is `scripts/validate-canonical-runtime-baseline.mjs --generate`. Its manifest states source fidelity `byte_identical: true`, source and baseline hash equal to the observed value, schema-only operation, and zero DML. The dependency manifest independently records the same observed source hash and matching catalog counts. These are generated artifacts committed in the repository, not a hash-count assumption.

The pre-existing D1-D1 reports are untracked and correctly document that the expected reference was unresolved; they do not recover an expected-hash file. The expected value is therefore stale or incorrect metadata relative to the authoritative generated artifact set.

## Byte-level comparison
- Current source vs canonical baseline copy: exact byte equality; 126597 bytes on both sides; no differing offset.
- Current source vs Git historical blob: 126597 versus 125722 bytes.
- First differing offset: 1422 (zero-based), current line 93, column 10.
- Difference: line-ending representation. Current bytes contain 875 CRLF sequences and 3894 LF bytes; Git blob is LF-only.
- No BOM difference: current begins `0A 0A 0A 53`; Git source is the LF-normalized form.
- No textual SQL difference after line-ending normalization.
- No semantic SQL difference was found; catalog and function identity evidence also match.

## Semantic comparison
The generated baseline and dependency artifacts report identical catalog counts: 27 tables, 249 columns, 27 primary keys, 7 unique constraints, 3 checks, 30 foreign keys, 47 functions, 3 views, 22 triggers, 86 RLS policies, 47 indexes, 7 extensions, and 2 enum types. They report no DML, no fabricated `auth.users`, and no production execution. This supports the current source as the generated canonical baseline artifact.

## Determinism evidence
- Source and baseline copy have identical raw bytes and identical observed SHA-256.
- Baseline manifest and hash file agree with the observed SHA-256.
- Dependency graph and dependency manifest agree with the observed source SHA-256.
- Git history independently preserves the same normalized SQL, while its LF representation explains the different raw Git-blob hash.
- No deterministic reproduction of the supplied expected hash was found.

## Decision
PASS — CANONICAL BASELINE PROVENANCE VERIFIED

## Reason
Authoritative committed baseline-generation artifacts identify `production-schema.sql` as the source, record the observed hash, and assert raw-byte identity with the canonical baseline copy. The expected hash is absent from every committed Git tree and has no recovered file or authoritative generation record. The current raw file was not changed during this investigation; its difference from the Git blob is an existing newline checkout representation under `core.autocrlf=true`, not an unexplained SQL modification. The previous expected hash is therefore stale/incorrect metadata and is retained unchanged in historical artifacts.

## Mutation counters
```text
PRODUCTION_ACCESS = NO
PRODUCTION_MUTATION = 0
DATABASE_MUTATION = 0
MIGRATION_EXECUTION = 0
RESET = 0
REBUILD = 0
SEED = 0
AUTH_MUTATION = 0
STORAGE_MUTATION = 0
RLS_MUTATION = 0
APPLICATION_IMPLEMENTATION = 0
```

No baseline, report, historical artifact, database, or application file was modified except for creation of the five requested D1-D.2 provenance outputs.