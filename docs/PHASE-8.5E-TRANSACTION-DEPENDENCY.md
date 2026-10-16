# Phase 8.5E Transaction Dependency

| Concern | Decision | Evidence |
|---|---|---|
| Event insert + approval insert | NON-ATOMIC currently; ATOMIC required by the approved future design | `useCreateEvent` performs independent inserts; Phase 8.5B requires one governed transaction |
| Audit | Approval audit INSIDE the database transaction; event-creation audit UNRESOLVED | `trg_log_event_approval AFTER INSERT`; event audit coverage not proven |
| Notification | OUTSIDE database transaction | `send-event-notification` is an external Edge Function invocation |
| Duplicate validation | UNRESOLVED: cannot classify as valid hard block until semantics and visibility are owned | canonical function body invalid; historical rule conflicts |
| Idempotency | REQUIRED by retry/double-submit risk, mechanism UNRESOLVED | no canonical key/constraint identified |

Future sequence must be authenticated Admin Provinsi authorization, valid duplicate decision, atomic event plus required pending approval, transactional audit behavior, then post-commit notification with retry/observability. The transaction function must remain blocked.
