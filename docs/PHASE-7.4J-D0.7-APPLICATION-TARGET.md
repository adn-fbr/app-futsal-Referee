# PHASE 7.4J-D0.7 Application Target

Classification: **CLIENT_TARGET_REMOTE_NON_PRODUCTION**.

- `src/integrations/supabase/client.ts` consumes `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `.env` safe metadata: `VITE_SUPABASE_PROJECT_ID=shorsqyycpptxcutrqrb`.
- `.env` safe URL host: `shorsqyycpptxcutrqrb.supabase.co`.
- `.env.example` has the same non-production project reference and URL host.
- No local URL such as `localhost` or `127.0.0.1` is configured.
- Key values were not printed.

The browser application is configured for the remote non-production project. This does not prove that the remote schema, rows, Auth users, or Storage objects exist.