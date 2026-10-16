# PHASE 7.4J-D0.8 Remote Database Access

STATUS: BLOCKED FOR RECONSTRUCTION

## Boundary

- CLI target: `shorsqyycpptxcutrqrb`.
- Production: `xfscfjwapwnkiinkgbjg`.
- `supabase/config.toml` project reference: `shorsqyycpptxcutrqrb`.
- Production was not queried.

## Access result

Classification: **REMOTE_DATABASE_ACCESSIBLE**.

Read-only evidence succeeded against the configured non-production project:

- `supabase migration list --linked -o json` connected and returned remote history.
- `supabase inspect db table-stats --linked` returned estimated counts.
- `supabase db dump --linked --schema public,auth,storage --file <temporary-file>` produced a schema-only dump.
- Remote schema dump SHA-256: `15bd39c8b6d0c7abb76177ea694bf7c4f8cfa2dc07a9c6dcce59732e731a3814`.

No data-only dump, SQL query, migration, reset, push, seed, Auth mutation, Storage mutation, or Production operation was performed.

## Tooling side effect

The schema-only dump automatically pulled the required `public.ecr.aws/supabase/postgres:17.6.1.166` Docker image. This changed local Docker image state and is recorded as `DOCKER_MUTATION = 1` for transparent accounting. No container, volume, database, or application data was created or modified.