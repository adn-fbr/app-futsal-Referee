# PHASE 7.4J-D0 Migration Reconstruction Model

## Set 1 — Canonical-Compatible

Use only migrations proven compatible with the offline canonical baseline, after ordered static review and conflict isolation. Production remains read-only evidence; no Production object is queried or changed.

## Set 2 — Non-Production Application Delta

Keep application-only changes separate, including any rich-search implementation and test fixtures. They must not be mixed into canonical baseline reconstruction.

## Policy

Do not mark migrations applied to hide drift. A history repair is valid only after schema evidence proves the migration's objects exist. Current state is not ready for repair.
