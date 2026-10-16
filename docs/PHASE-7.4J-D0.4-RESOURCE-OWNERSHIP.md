# PHASE 7.4J-D0.4 Resource Ownership

| Resource | Owner | In use | Database related | Safe to remove |
|---|---|---:|---:|---:|
| `futsal_os-postgres-1` | POSTGRES/APPLICATION | No, stopped | Yes | No |
| `futsal_id_postgres_data` | POSTGRES | Unknown | Yes | No |
| `futsal_os_futsal-postgres` | POSTGRES | Unknown | Yes | No |
| `futsal_os_futsal-postgres-data` | POSTGRES | Unknown | Yes | No |
| `supabase_db_futsal_id` | SUPABASE | Unknown | Yes | No |
| `supabase_storage_futsal_id` | SUPABASE | Unknown | Storage | No |
| `futsal_id_minio_data` | APPLICATION/STORAGE | Unknown | No | No |
| `futsal_id_redis_data` | APPLICATION | Unknown | No | No |
| Supabase images | SUPABASE | Not referenced by running container | Runtime required unknown | No |
| Postgres images | POSTGRES | `postgres:16-alpine` referenced by stopped container | Yes | No |
| Networks | SUPABASE/APPLICATION/UNKNOWN | Unknown | Possible | No |

No resource was removed.
