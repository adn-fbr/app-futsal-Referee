# PHASE 7.4J-D0.9C Reconstruction Disposition

Future design remains:

- Schema: canonical Production baseline.
- Data: synthetic only.
- Auth: synthetic identities only.
- Application fixtures: synthetic only.
- Storage: synthetic only.
- RLS/functions/views/triggers/indexes: canonical definitions.

Current disposition: `AUTH_DISPOSITION = GOVERNANCE_REQUIRED` because Auth cannot be safely enumerated and provenance is unknown. Missing canonical tables are classified as `EXPECTED_RECONSTRUCTION_GAP`, not unexplained unknowns. The reconstruction method remains Option A, with D1 blocked until governance and Auth evidence are complete.