# Phase 8.5B Audit and Trigger Analysis

## Database evidence

`production-schema.sql` defines `trg_log_event_approval AFTER INSERT ON event_approvals FOR EACH ROW EXECUTE FUNCTION log_event_approval()` and audit-log functions/infrastructure. Existing application hooks also write audit logs for selected mutations and create notifications for assignment cancellation.

## Transaction implications

The approval audit trigger runs inside the database transaction containing the approval insert. If the transaction aborts, the approval and its trigger side effects should roll back together. External email/notification Edge Function calls are not inherently part of the PostgreSQL transaction and must be modeled as post-commit work with retry/observability.

## Design checks for implementation

- Confirm event creation itself has canonical audit coverage or add only through approved existing mechanism.
- Confirm actor ID is derived from `auth.uid()`/authorized caller, never client-supplied as authority.
- Confirm audit records contain no password.
- Verify one committed event and approval produce expected audit records; failed transaction produces none/incomplete none.
- Verify notification failure does not falsely report full delivery success.

No trigger, audit table, notification function, or schema object was changed in 8.5B.
