# Phase 8.5E Semantic Ownership Report

## Final gate

`BLOCKED — SEMANTIC OWNERSHIP INCOMPLETE`

## Canonical contract

Function identity: `public.check_duplicate_event(text,text,text)`.

The canonical source establishes the parameter names and boolean return, but it does not establish the domain meaning of `p_kota_id`. The body references `events.kota_id`, which is absent from the canonical `events` table. The table instead has nullable `kabupaten_kota_id uuid`, referencing `kabupaten_kota.id`.

## Ownership decision

`p_kota_id` is `SEMANTICALLY UNRESOLVED`.

Evidence proves neither:

- equivalence with `events.kabupaten_kota_id`, nor
- non-equivalence requiring a distinct `kota_id` entity.

The historical application contract is a separate five-argument similarity search using `p_kabupaten_kota_id`; it is historical evidence, not canonical authority.

## Duplicate semantics

No authoritative business rule establishes D1, D2, D3, or D4. The canonical body appears intended to perform exact name/location/region matching, but it cannot be relied on while referencing a missing column. Historical fuzzy/date-aware behavior cannot be promoted to canonical semantics.

## Security and transaction consequences

The function is `SECURITY DEFINER`, `VOLATILE`, grants include anonymous and authenticated roles, and no fixed `search_path` is specified. A boolean result may disclose existence beyond caller-visible rows. The current event and approval writes are non-atomic; the approval audit trigger is transactional, while external notification is post-commit work. Duplicate validation and idempotency remain unresolved for implementation.

No database, source, migration, type, baseline, RLS, fixture, or Production change was made.
