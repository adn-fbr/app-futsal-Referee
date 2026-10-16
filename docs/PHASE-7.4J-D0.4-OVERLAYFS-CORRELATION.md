# PHASE 7.4J-D0.4 OverlayFS Correlation

Previous error:

`failed to stat parent ... /var/lib/desktop-containerd/daemon/io.containerd.snapshotter.v1.overlayfs/snapshots/.../fs: no such file or directory`

Correlated facts:

- Docker uses overlayfs/containerd snapshotter.
- Docker storage is hosted on C:.
- C: has approximately 10.0 GB free.
- Docker images use 19.35 GB with 18.69 GB reclaimable.
- The failure occurred during read-only pg_dump container creation.

Classification: **STORAGE_CAPACITY_PROBLEM probable / DOCKER_STORAGE_PROBLEM unresolved**. Filesystem corruption or stale layer is not proven. Current state: **NOT REPRODUCED**.
