# PHASE 7.4J-D0 Docker Diagnostic

- Docker Desktop/server: responding.
- Engine: 29.7.2, overlayfs via io.containerd snapshotter.
- Prior failure: `pg_dump` container creation failed while statting an overlayfs snapshot path.
- Affected operation: read-only linked public-schema dump.
- Classification: **LOCAL_DOCKER_STORAGE_FAILURE**.
- Reproducibility: not retried destructively; root cause is consistent with local overlayfs storage state.
- Containers: one stopped Postgres container, `futsal_os-postgres-1`.
- Volumes: seven local volumes, including Postgres/MinIO/Redis/Supabase data volumes.
- Cleanup: no deletion performed; volumes classified PRESERVE/UNKNOWN pending ownership.
