# PHASE 7.4J-D0.3A Reclaimable Resources

Reported reclaimable images total **18.69 GB**, but image ownership is not unambiguously disposable: the inventory includes Supabase service images in multiple versions that may be required for the next local workload.

| Resource class | Evidence | Classification | Action |
|---|---|---|---|
| Supabase images | Multiple service/version images | UNKNOWN | KEEP |
| Postgres images | `postgres:16-alpine` and Supabase Postgres images | PRESERVE/UNKNOWN | KEEP |
| Application images | Not separately proven | UNKNOWN | KEEP |
| Database/Supabase volumes | Seven named volumes | PRESERVE | KEEP |
| Stopped Postgres container | Project-specific | PRESERVE | KEEP |
| Build cache | 0 B | SAFE_TO_REMOVE but no capacity benefit | KEEP |

No resource met the unambiguous `SAFE_TO_REMOVE` threshold with meaningful benefit.
