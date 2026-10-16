# Phase 7.4J-D0.2 Reconstruction Set

## Canonical Reconstruction Set

Use ordered migrations proven compatible with offline `production-schema.sql` and baseline artifacts, including the later events-column migration only after per-file validation. Exclude broad historical replay until conflict isolation is complete.

## Non-Production Delta Set

Keep rich duplicate search and test fixtures outside canonical reconstruction. The historical SECURITY DEFINER `check_duplicate_event` migration is excluded because it conflicts with the frozen canonical contract.

## Status

Reconstruction set: **BLOCKED**. No silent skips, rewrites, or history repair were performed.
