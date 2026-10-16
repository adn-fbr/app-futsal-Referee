# PHASE 7.4J-D0.5A Capacity Evidence

## Host storage

| Drive | Total | Used | Free |
|---|---:|---:|---:|
| C: | `200,667,283,456` bytes | `167,686,934,528` bytes | `32,980,348,928` bytes (`30.71 GiB`) |
| D: | `53,686,038,528` bytes | `39,551,655,936` bytes | `14,134,382,592` bytes (`13.16 GiB`) |

The C: used value is not required for the gate and is not asserted because the read-only snapshot returned the exact C: free value but the report only needs free capacity. Docker storage is located on C:.

## Docker data filesystem

Read-only `df -kP /mnt/docker-desktop-disk` reported:

- Device: `/dev/sdd`.
- Filesystem: `ext4`.
- Total: `1,055,762,868 KiB` (`1,081,100,152,832` bytes; approximately `1006.85 GiB`).
- Used: `1,543,308 KiB` (`1,580,347,392` bytes; approximately `1.47 GiB`).
- Available: `1,000,516,088 KiB` (`1,024,528,474,112` bytes; approximately `954.17 GiB`).
- Use percentage: `0%`.

## Docker usage

`docker system df -v` reported:

- Images: `0`.
- Containers: `0`.
- Local volumes: `0`.
- Build cache: `0 B`.

## Classification

Docker filesystem capacity: **SUFFICIENT** based on observed active data-filesystem capacity and available space. This does not certify the local Supabase runtime or database-volume protection. Overall infrastructure readiness remains blocked.