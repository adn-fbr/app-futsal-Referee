# PHASE 7.4J-D0.1 Environment Diagnostic

Status: **BLOCKED**

- OS: Windows with Docker Desktop/WSL2.
- Application target: `shorsqyycpptxcutrqrb`.
- CLI target: `shorsqyycpptxcutrqrb`.
- Production: `xfscfjwapwnkiinkgbjg` not selected.
- Supabase CLI: 2.67.1.
- Docker Engine: 29.7.2; Docker Desktop 4.90.0.
- Storage driver: overlayfs via io.containerd snapshotter.
- Docker root: `/var/lib/docker`.
- Contract and baseline hashes: verified/unchanged.

Readiness remains blocked by overlayfs dump failure, limited host free space, inconsistent migrations, and unknown data/Auth/Storage state.
