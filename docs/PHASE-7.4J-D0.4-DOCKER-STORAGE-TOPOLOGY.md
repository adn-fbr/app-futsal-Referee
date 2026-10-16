# PHASE 7.4J-D0.4 Docker Storage Topology

- Docker Desktop WSL distribution: `docker-desktop`, running, WSL2.
- Storage driver: `overlayfs` via containerd snapshotter.
- Docker root: `/var/lib/docker` inside Docker Desktop VM.
- Docker virtual disk: `C:\Users\narha\AppData\Local\Docker\wsl\disk\docker_data.vhdx`.
- VHDX file size: approximately 23.1 GB.
- Host filesystem: NTFS.
- Docker settings confirm `UseContainerdSnapshotter=true`.
- C: free: approximately 10.0 GB.
- D: free: approximately 14.1 GB.

The Docker storage location is C:, not D:.
