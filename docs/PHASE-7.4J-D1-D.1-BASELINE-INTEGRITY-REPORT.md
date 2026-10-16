# PHASE 7.4J-D1-D.1 — CANONICAL BASELINE INTEGRITY RESOLUTION

## Phase
PHASE 7.4J-D1-D.1

## Purpose
CANONICAL BASELINE INTEGRITY RESOLUTION

## Safety boundary
This investigation is read-only and non-mutating. No database migration, rebuild, seed, reset, auth, storage, RLS, or production access was performed.

## Expected canonical hash
`b77b6cf72482a3401a7abd0a097f24587b6b78e88bbf1c6a816f1f1c9ed98db1`

## Actual file hash (byte-preserving, independently verified)
`b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`

## File inspected
`D:\AFP SULSEL\app-futsal\production-schema.sql`

## File metadata
- length_bytes: 126597
- last_write_utc: 2026-09-07T07:23:53.3207946Z
- encoding: UTF-8 text observed via byte stream, not normalized or regenerated
- BOM: present as first bytes `10,10,10,83` (no UTF-8 BOM; LF-leading text)
- CRLF: true
- LF: true
- newline mixture: yes

## Independent hash reproduction
Two independent byte-level SHA-256 calculations were run and matched exactly:
- `Get-FileHash` result: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`
- .NET `SHA256` over raw bytes: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`

## Provenance finding
The actual file on disk hashes to the observed value, not the expected canonical value. The repository evidence set also contains the observed value in the generated baseline and manifest artifacts. No copy of the expected hash was found in the current repository inventory. This means the canonical-reference provenance remains unresolved: the system contains a current file hash and a separate expected hash, but there is no independent evidence proving which source is authoritative for the baseline beyond the externally stated expected value.

## Reporting artifact error check
The mismatch is not confined to D1-D reporting: the actual file itself hashes to the observed value. Therefore this is not classified as a pure reporting artifact error.

## Classification
`BLOCKED — BASELINE PROVENANCE UNRESOLVED`

## Final gate
`BLOCKED — BASELINE PROVENANCE UNRESOLVED`

## Mutation status
- DATABASE_MUTATION = 0
- MIGRATION_EXECUTION = 0
- RESET = 0
- REBUILD = 0
- SEED = 0
- AUTH_MUTATION = 0
- STORAGE_MUTATION = 0
- RLS_MUTATION = 0
- APPLICATION_IMPLEMENTATION = 0
- PRODUCTION_ACCESS = NO
- PRODUCTION_MUTATION = 0

## Conclusion
The baseline immutability investigation did not allow any reconstruction to resume. The file is treated as immutable evidence, the observed hash is independently reproduced, and the mismatch remains unresolved because the expected authoritative hash cannot be proven from the repository state alone.
