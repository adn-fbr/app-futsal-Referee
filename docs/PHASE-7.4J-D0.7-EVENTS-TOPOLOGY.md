# PHASE 7.4J-D0.7 Events Topology

Status: **REMOTE_NON_PRODUCTION; VERIFICATION BLOCKED**.

The application target is the remote non-production project. The frozen verification contract is:

- canonical `public.check_duplicate_event(text,text,text) RETURNS boolean` unchanged;
- rich duplicate search separate from the canonical function;
- `SECURITY INVOKER`;
- RLS enforced with caller-authorized visibility;
- ordering `similarity_score DESC, date DESC`;
- default limit 5;
- numeric similarity threshold not frozen.

The remote Events schema and function catalog were not queried. Local verification is unavailable. No function, table, policy, or index was created or modified.