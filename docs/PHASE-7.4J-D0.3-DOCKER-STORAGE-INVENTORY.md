# PHASE 7.4J-D0.3 Docker Storage Inventory

## Containers

- `futsal_os-postgres-1`: stopped, exit 255, database-related, **PRESERVE**.

## Volumes

- `futsal_id_minio_data`: application/storage-related, **PRESERVE**.
- `futsal_id_postgres_data`: database-related, **PRESERVE**.
- `futsal_id_redis_data`: application state, **PRESERVE/UNKNOWN**.
- `futsal_os_futsal-postgres`: database-related, **PRESERVE**.
- `futsal_os_futsal-postgres-data`: database-related, **PRESERVE**.
- `supabase_db_futsal_id`: Supabase database-related, **PRESERVE**.
- `supabase_storage_futsal_id`: Supabase storage-related, **PRESERVE**.

## Images

Supabase, Postgres, MinIO, Redis, and application images exist. Ownership of unused images is not sufficiently established for deletion.

## Cache

Build cache: 0 B. No cleanup performed.
