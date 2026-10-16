# PHASE 7.4J-D0.1 Docker Storage Analysis

Previous error: `failed to create docker container: failed to stat parent: stat /var/lib/desktop-containerd/daemon/io.containerd.snapshotter.v1.overlayfs/snapshots/.../fs: no such file or directory` during read-only pg_dump.

Classification: **LOCAL_DOCKER_STORAGE_FAILURE** with overlayfs/containerd snapshot path involvement. Docker daemon currently responds, but the prior failure is not proven resolved.

Current usage:

- Images: 19.35 GB; reclaimable 18.69 GB.
- Containers: one stopped Postgres container, 20.48 KB reclaimable.
- Volumes: seven, 317.1 MB total and 216.3 MB reclaimable; database/storage volumes preserved.
- Build cache: 0 B.

No prune, volume deletion, container removal, or retry of the failed dump was executed.
