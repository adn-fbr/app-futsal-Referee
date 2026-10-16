# PHASE 7.4J-D0.5 Capacity Revalidation

## Host capacity

- C: total 200,667,283,456 bytes; used 167,712,100,352 bytes; free 32,955,183,104 bytes (30.69 GiB).
- D: total 53,686,038,528 bytes; used 39,551,631,360 bytes; free 14,134,407,168 bytes (13.16 GiB).
- Docker Desktop storage remains on C:, not D:.

## Docker capacity

- Docker root: `/var/lib/docker`.
- `docker system df -v`: zero images, zero containers, zero volumes, and zero build cache.
- Docker virtual disk: `C:\Users\narha\AppData\Local\Docker\wsl\disk\docker_data.vhdx`.
- Observed VHDX file size: 1,656,750,080 bytes (1.543 GiB).
- Virtual-disk configured limit and internal free space are not observable from these read-only checks.
- VHDX file size is not treated as virtual-disk free space.

## Decision

Capacity classification: **UNKNOWN**.

The host C: free-space observation improved from the D0.4 approximate 10.0 GB to 30.69 GiB, but the next phase requires a functioning local Supabase/database runtime and protected volumes. Those resources are absent, and Docker internal free capacity is unknown. No invented minimum threshold is applied.

GATE IMPACT: BLOCKED.