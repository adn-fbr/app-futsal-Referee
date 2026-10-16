# PHASE 7.4J-D0.9 Storage Strategy

Storage is application-required and must be reconstructed only in the non-production boundary.

- Buckets: define required bucket names from application references, especially `documents`; approval required before creation.
- Policies: preserve canonical Storage policy semantics and caller authorization.
- Files: synthetic fixtures only; never copy Production files.
- Signed URLs: validate only against synthetic objects after approved setup.
- Current remote state: storage schema present, zero buckets observed.

Status: **GOVERNANCE_REQUIRED**. No bucket, object, or policy mutation is authorized.