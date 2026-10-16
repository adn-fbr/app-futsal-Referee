# PHASE 7.4J-D0.9A Migration Conflict Register

Status: **BLOCKED — GOVERNANCE PREPARATION ONLY**.

The three material conflicts are fully classified. No migration was edited, deleted, renamed, reordered, marked applied, repaired, or executed.

| ID | Object | Classification | Disposition |
|---|---|---|---|
| C-01 | Broad pg_dump replay / `app_role` | HISTORICAL | ARCHIVE_AS_HISTORICAL |
| C-02 | `events.deleted_at`, `events.kabupaten_kota_id` | COMPATIBLE; remote drift | SUPERSEDE historical intent with canonical baseline |
| C-03 | `check_duplicate_event` | CONFLICTING | REJECT historical conflicting contract |

Canonical baseline precedence is established. Execution authorization remains **NOT GRANTED**.