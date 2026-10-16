# PHASE 7.4J-D0.5A Docker Virtual Disk

STATUS: BLOCKED

## Boundary

- Non-production: `shorsqyycpptxcutrqrb`.
- Production: `xfscfjwapwnkiinkgbjg`.
- `supabase/config.toml` project reference: `shorsqyycpptxcutrqrb`.
- CLI target differs from production: PASS.

## Active storage

- Docker Desktop storage file: `C:\Users\narha\AppData\Local\Docker\wsl\disk\docker_data.vhdx`.
- Host drive: C:.
- Host filesystem: NTFS.
- VHDX current allocated file size: `1,673,527,296` bytes (`1.559 GiB`).
- VHDX last modification observed: `2026-09-07 22:30:13` local timestamp.
- VHDX file was not modified.

## Docker data filesystem

The running `docker-desktop` WSL distribution exposes the active Docker data disk at `/mnt/docker-desktop-disk`:

- Device: `/dev/sdd`.
- Filesystem: `ext4`.
- Filesystem capacity: `1,055,762,868 KiB` (approximately `1006.85 GiB`).
- Filesystem used: `1,543,308 KiB` (approximately `1.47 GiB`).
- Filesystem available: `1,000,516,088 KiB` (approximately `954.17 GiB`).
- Reported use: `0%`.

This filesystem measurement is distinct from the allocated VHDX file size. Docker API reports Docker root `/var/lib/docker`; that path is not mounted in the utility WSL namespace, so the `/mnt/docker-desktop-disk` filesystem evidence is used as the active Docker data-disk capacity evidence.

## Limitations

- Docker Desktop settings store contains `UseContainerdSnapshotter=true` but no explicit disk-size or configured maximum field.
- Windows `Get-VHD` cmdlet is unavailable in this environment.
- Configured virtual-disk maximum capacity: **UNKNOWN**.
- The VHDX allocated file size is not interpreted as virtual-disk free space.

Virtual disk filesystem state: **OBSERVED**.
Capacity classification: **SUFFICIENT** for infrastructure capacity only.