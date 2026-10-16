# PHASE 7.4J-D0.5A — DOCKER VIRTUAL DISK CAPACITY VERIFICATION

STATUS: BLOCKED

NON-PRODUCTION: `shorsqyycpptxcutrqrb`
PRODUCTION: `xfscfjwapwnkiinkgbjg`
CLI TARGET: `shorsqyycpptxcutrqrb`

HOST STORAGE:
C FREE: `32,980,348,928` bytes (`30.71 GiB`)
D FREE: `14,134,382,592` bytes (`13.16 GiB`)

DOCKER:
STORAGE DRIVER: `overlayfs` (`io.containerd.snapshotter.v1`)
DOCKER ROOT: `/var/lib/docker`

DOCKER STORAGE LOCATION:
VIRTUAL DISK: `docker_data.vhdx`
VIRTUAL DISK PATH: `C:\Users\narha\AppData\Local\Docker\wsl\disk\docker_data.vhdx`
VIRTUAL DISK FILE SIZE: `1,673,527,296` bytes (`1.559 GiB`)
VIRTUAL DISK CONFIGURED LIMIT: UNKNOWN
VIRTUAL DISK FILESYSTEM CAPACITY: `1,055,762,868 KiB` (`approximately 1006.85 GiB`, `/dev/sdd`, `ext4`)
VIRTUAL DISK FILESYSTEM USED: `1,543,308 KiB` (`approximately 1.47 GiB`)
VIRTUAL DISK FILESYSTEM FREE: `1,000,516,088 KiB` (`approximately 954.17 GiB`)

DOCKER USAGE:
IMAGES: `0`
CONTAINERS: `0`
VOLUMES: `0`
BUILD CACHE: `0 B`

LOCAL DATABASE/SUPABASE VOLUMES:
INTERPRETATION: `NO_LOCAL_SUPABASE_RUNTIME`; no local Supabase container, image, or Docker volume is visible. This does not claim database loss.

OVERLAYFS:
CURRENT STATE: `NOT_REPRODUCED`
EVIDENCE: Read-only Docker diagnostics and active data-filesystem checks show no current overlayfs or filesystem failure. The prior workload-path failure cannot be safely exercised because the local runtime resources are absent; this is not called resolved.

CAPACITY:
STATUS: `SUFFICIENT` for Docker filesystem capacity based on observed `ext4` data-disk free space. Host C: free space alone was not used as proof.

INFRASTRUCTURE:
STATUS: `INFRASTRUCTURE_BLOCKED`; Docker storage capacity is observable and sufficient, but the local Supabase runtime/protected-volume state is absent and the prior workload path cannot be validated without recreating protected state.

DATABASE MUTATION:
NO

MIGRATION:
NO

RESET:
NO

REBUILD:
NO

PRODUCTION ACCESS:
NO

PRODUCTION MUTATION:
NO

PRODUCTION DEPLOYMENT:
NO

BASELINE:
UNCHANGED

DETERMINISM: PASS; SHA-256 manifest generated over the six Markdown artifacts in sorted workspace-relative path order.

GATE: **BLOCKED**

The gate is blocked because local protected database/Supabase resources are absent and their disposition cannot be established in this read-only phase. Do not execute D0.6 actions, migrations, reset, rebuild, seed, SQL, RLS, Auth, or Storage changes.