# Phase 1.8E.3A Target Identity

## Target

- Project name: `test APP`
- Project ref: `shorsqyycpptxcutrqrb`
- Status: `ACTIVE_HEALTHY`
- Region: `ap-south-1`
- PostgreSQL: `17.6.1.166`
- Database host: `db.shorsqyycpptxcutrqrb.supabase.co`
- Environment: dedicated non-production security-test target

## Production reference

- Project name: `AFP SULSEL`
- Project ref: `xfscfjwapwnkiinkgbjg`
- Environment: LIVE / PRODUCTION
- Main repository configuration remains pointed at this production ref.

## Effective target evidence

The isolated CLI workspace was initialized and linked only to `shorsqyycpptxcutrqrb`. Its migration ledger query connected to the target and returned no local or remote migration entries. The main repository was not relinked or modified.

## Database identity

`current_database()`, `current_user`, `version()`, and `current_schema()` were not queried because the schema dump's local Docker container failed before producing a connection result. No credentials were exposed or requested through the assistant.
