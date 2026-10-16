# PHASE 7.4J-D0.9A Reconstruction Option Evaluation

## Option A — Canonical baseline reconstruction

**Recommended for initial reconstruction.** It uses the verified canonical baseline, avoids blind replay, and directly resolves remote schema drift. Blocked until data disposition, Auth relationship policy, Storage fixture governance, and rollback approval are complete.

## Option B — Curated historical migration reconstruction

**Blocked.** Remote history has 4 versions versus 55 local files; three conflicts affect replay, Events, and the duplicate-function contract. Equivalence to canonical Production is not proven.

## Option C — Canonical baseline plus validated future migrations

**Recommended after Option A validation.** Use the canonical baseline as the boundary and accept only future migrations individually compared to it.

Decision: Option A now, Option C for future evolution, Option B rejected until separately proven equivalent.