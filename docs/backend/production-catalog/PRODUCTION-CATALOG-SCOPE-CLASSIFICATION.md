# Production Catalog Scope Classification

## Gate

**CATALOG SCOPE CLASSIFICATION: BLOCKED**

The supplied `comments` result set is metadata-only and remains raw evidence. No rows, secrets, comments, or managed objects were deleted or rewritten.

The supplied evidence contains one `public` schema comment without owner, extension dependency, or object dependency evidence. Because schema name alone is insufficient to prove application ownership, that object is classified as `UNKNOWN` and requires review.

## 1. Scope rules

| Classification | Rule | Baseline inclusion |
| --- | --- | --- |
| `APPLICATION` | Authoritative ownership/dependency evidence proves application ownership | `true` |
| `SUPABASE_MANAGED` | Object belongs to `auth`, `storage`, or `vault` | `false` |
| `EXTENSION_MANAGED` | Object belongs to the `extensions` schema in the supplied evidence or is extension-owned by catalog dependency evidence | `false` |
| `POSTGRES_SYSTEM` | Object belongs to `pg_catalog`, `information_schema`, `pg_toast`, or another PostgreSQL internal schema | `false` |
| `INTERNAL` | Internal object classification established by authoritative catalog evidence | `false` |
| `UNKNOWN` | Ownership cannot be conclusively established from supplied evidence | `false` |

`object_kind = 'i'` is classified as `INDEX`, not as a table.

## 2. Classification counts

| Scope | Count |
| --- | ---: |
| `APPLICATION` | 0 |
| `SUPABASE_MANAGED` | 31 |
| `EXTENSION_MANAGED` | 4 |
| `POSTGRES_SYSTEM` | 1 |
| `INTERNAL` | 0 |
| `UNKNOWN` | 1 |
| **Total supplied objects** | **37** |

The total is the number of supplied comment-result objects classified below. These are not database-wide object counts.

## 3. Application objects

None can be classified as `APPLICATION` from the supplied comments rows alone. Objects in `public` require owner, extension-membership, and dependency evidence before baseline inclusion.

## 4. Supabase-managed objects

All supplied objects in `auth`, `storage`, and `vault` are preserved as raw evidence and excluded from the application baseline.

### `auth` schema: 28 objects

| Object kind | Object |
| --- | --- |
| `column` | `auth.identities.email` |
| `column` | `auth.mfa_factors.last_webauthn_challenge_data` |
| `column` | `auth.sessions.not_after` |
| `column` | `auth.sessions.refresh_token_counter` |
| `column` | `auth.sessions.refresh_token_hmac_key` |
| `column` | `auth.sso_providers.resource_id` |
| `column` | `auth.users.is_sso_user` |
| `index` | `auth.identities_email_idx` |
| `index` | `auth.users_email_partial_key` |
| `routine` | `auth.email()` |
| `routine` | `auth.role()` |
| `routine` | `auth.uid()` |
| `table` | `auth.audit_log_entries` |
| `table` | `auth.flow_state` |
| `table` | `auth.identities` |
| `table` | `auth.instances` |
| `table` | `auth.mfa_amr_claims` |
| `table` | `auth.mfa_challenges` |
| `table` | `auth.mfa_factors` |
| `table` | `auth.oauth_client_states` |
| `table` | `auth.refresh_tokens` |
| `table` | `auth.saml_providers` |
| `table` | `auth.saml_relay_states` |
| `table` | `auth.schema_migrations` |
| `table` | `auth.sessions` |
| `table` | `auth.sso_domains` |
| `table` | `auth.sso_providers` |
| `table` | `auth.users` |

### `storage` schema: 2 objects

- `storage.objects.owner` — `column`
- `storage.buckets.owner` — `column`

### `vault` schema: 1 object

- `vault.secrets` — `table`

## 5. Extension-managed objects

The supplied evidence contains four routines in `extensions`, classified as `EXTENSION_MANAGED` and excluded from the application baseline:

- `extensions.grant_pg_cron_access()`
- `extensions.grant_pg_graphql_access()`
- `extensions.grant_pg_net_access()`
- `extensions.set_graphql_placeholder()`

This classification is based on the authoritative schema location in the supplied evidence. Extension ownership for objects in other schemas must be confirmed from `pg_depend` before classification.

## 6. PostgreSQL-system objects

- `pg_toast` — `schema`, classified as `POSTGRES_SYSTEM`, baseline inclusion `false`.

The exact supplied comment, `reserved schema for TOAST tables`, remains part of the raw comments evidence.

## 7. Internal objects

No supplied object has sufficient evidence for the separate `INTERNAL` classification. Internal objects discovered in later catalog result sets must be classified independently and retained in raw evidence.

## 8. Unknown/review objects

| Object | Classification | Baseline inclusion | Classification status | Reason |
| --- | --- | ---: | --- | --- |
| `public` schema | `UNKNOWN` | `false` | `REVIEW_REQUIRED` | The supplied comment row has no owner, extension membership, or dependency information. Schema name alone cannot prove application ownership. |

## 9. Baseline inclusion/exclusion rationale

- Raw production catalog evidence is not reduced by this classification.
- Managed, extension-owned, system, and internal objects remain available for audit and dependency analysis.
- No supplied object is promoted to application baseline scope without authoritative ownership evidence.
- `auth`, `storage`, and `vault` must not be recreated as application schema.
- `pg_toast` must not be recreated as application schema.
- `extensions` routines must not be treated as application routines.
- The `public` schema remains excluded from baseline inclusion pending owner and dependency evidence; its application objects cannot be inferred from the schema name alone.

## Raw evidence integrity

The supplied comments result set, including exact comments for `auth`, `storage`, `vault`, `extensions`, `pg_toast`, and `public`, is preserved as raw evidence. This classification document is an index and scope decision record; it is not a replacement or normalized rewrite of the raw catalog result set.

## Next required evidence

Provide owner, extension-membership, and dependency records for the `public` schema and its objects. Re-run classification after those records are joined to the raw catalog evidence. Only then may objects be selected for canonical application baseline conversion.
