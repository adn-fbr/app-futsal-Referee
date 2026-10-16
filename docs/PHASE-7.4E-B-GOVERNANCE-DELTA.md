# PHASE-7.4E-B Governance Delta

Version: v1.0.0

## Known from codebase

| Topic | Codebase evidence | Confidence |
| --- | --- | --- |
| Runtime call-site | One call in `useEvents.ts:556`, consumed by `EventEdit` | CONFIRMED |
| Input count and expressions | Five named arguments as recorded in the call-site | CONFIRMED |
| Input origins | EventEdit form and route event id | CONFIRMED |
| Historical result fields | id, name, date, location, status, similarity_score | CONFIRMED |
| Application wrapper | `isDuplicate` derived from array length; `duplicates` returned | CONFIRMED |
| Historical algorithm | Lowercase exact/contains CASE scoring with date/region/exclusion filters | CONFIRMED |
| Historical ordering/limit | similarity score DESC, date DESC, LIMIT 5 | CONFIRMED |
| Error behavior | Hook throws RPC error; EventEdit catches and allows proceeding | CONFIRMED |
| Current canonical function | Three text arguments, boolean return, exact EXISTS | CONFIRMED |
| Direct repository boundary | Missing; hook calls Supabase directly | CONFIRMED |

## Still requires governance

| Topic | Required decision |
| --- | --- |
| Rich function name/schema/signature | TBD / GOVERNANCE REQUIRED |
| PostgreSQL argument types/nullability | TBD / GOVERNANCE REQUIRED |
| Approved return contract | TBD / GOVERNANCE REQUIRED |
| Similarity algorithm and threshold | TBD / GOVERNANCE REQUIRED |
| Visibility and RLS behavior | TBD / GOVERNANCE REQUIRED |
| Security invoker/definer and EXECUTE roles | TBD / GOVERNANCE REQUIRED |
| Ordering, limit, pagination | TBD / GOVERNANCE REQUIRED |
| Performance targets and indexes | TBD / GOVERNANCE REQUIRED |
| Error and empty-result policy | TBD / GOVERNANCE REQUIRED |
| Compatibility and migration | TBD / GOVERNANCE REQUIRED |

Codebase evidence does not equal Production approval. No unresolved item is converted into an implementation decision.
