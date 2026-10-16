# PHASE 7.4J-D0.9 Reconstruction Options

## Option A — Canonical baseline reconstruction

Reconstruct the non-production schema from the verified canonical baseline, keep Auth external-managed, then add separately approved synthetic fixtures. This is the most deterministic schema method. It still requires remote data-disposition and rollback approval.

## Option B — Migration reconstruction

Reconcile and execute a curated migration sequence. This is currently blocked by 55-vs-4 history divergence and three material conflicts. Blind replay is rejected.

## Option C — Hybrid

Use the canonical baseline for the schema and retain only validated post-baseline migrations for future evolution. This is the recommended future maintenance shape, but not an execution authorization.

Evaluation: A is preferred for initial reconstruction; C is preferred for subsequent evolution; B is not currently safe.