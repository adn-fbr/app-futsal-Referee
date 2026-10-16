# Phase 1.8E.3A CLI Isolation

## Status

**PASS for isolated CLI context; BLOCKED for database catalog verification.**

## Separation

- Main repository: `D:\AFP SULSEL\app-futsal`
- Main repository config: `supabase/config.toml` retains production ref `xfscfjwapwnkiinkgbjg`.
- Isolated CLI workspace: `D:\AFP SULSEL\afp-sulsel-security-test-cli`
- Isolated workspace contains only a fresh `supabase init` context and its own link metadata.
- No repository `.env`, credentials, service-role key, database password, JWT secret, or production deployment configuration was copied.

## Link evidence

The isolated workspace was linked with:

```text
supabase link --project-ref shorsqyycpptxcutrqrb
```

Read-only `supabase projects list` from the isolated workspace marked `shorsqyycpptxcutrqrb` as linked and identified it as `test APP` in `ap-south-1`.

Read-only `supabase migration list --linked` returned an empty Local/Remote migration table for the isolated workspace.

## Database inspection

A schema-only read-only dump was attempted from the isolated workspace. It did not complete because Docker failed locally while creating the dump container:

```text
commit failed: write /var/lib/desktop-containerd/daemon/io.containerd.snapshotter.v1.overlayfs/metadata.db: input/output error
```

No remote database write occurred. Target application object counts and database identity query remain unverified.
