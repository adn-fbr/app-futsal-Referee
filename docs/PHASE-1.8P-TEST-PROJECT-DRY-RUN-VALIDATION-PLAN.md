# PHASE 1.8P — Test Project Dry-Run / Candidate Validation Plan

Date: 2026-09-24
Mode: READ-ONLY / TEST PREPARATION
Test project: `shorsqyycpptxcutrqrb`
Production project: `xfscfjwapwnkiinkgbjg`

## Gate

**BLOCKED — test execution plan prepared; no migration or DDL/DML was applied.**

## 1. Objective

Validate the Phase 1.8 candidate against the isolated Test project before any Production decision.

The test phase must prove:

- exact function signatures remain stable;
- SECURITY DEFINER functions use the intended search_path;
- browser EXECUTE boundary is explicit;
- internal notification RPCs remain non-browser callable;
- canonical notification tables have the intended RLS boundary;
- public settings remain read-only to authenticated clients;
- card counter/issuance behavior is concurrency-safe;
- trigger behavior remains intact;
- public card verification does not expose internal identifiers or counters;
- no historical data is silently rewritten.

## 2. Current Test evidence

The Test project already contains newer canonical notification/card infrastructure than Production.

Observed SECURITY DEFINER functions include:

- `claim_event_completion_notification(uuid,uuid,text)` — anon/auth denied, `search_path=""`;
- `create_event_completion_notification_intents()` — anon/auth denied, `search_path=""`;
- `finalize_event_completion_notification(...)` — anon/auth denied, `search_path=""`;
- `claim_notification_channel(uuid,text,uuid)` — anon/auth denied, `search_path=public,pg_temp`;
- `finalize_notification_channel(...)` — anon/auth denied, `search_path=public,pg_temp`;
- `issue_my_referee_card()` — anon denied, authenticated allowed, `search_path=public`;
- `issue_referee_card_for_admin(uuid)` — anon denied, authenticated allowed, `search_path=public`;
- `bulk_issue_referee_cards()` — anon denied, authenticated allowed, `search_path=public`.

This proves Test is **not a clean copy of Production** and cannot be treated as a simple before/after clone.

## 3. Test execution order

### T0 — Snapshot

Capture:

- function signatures;
- function ACLs;
- function `proconfig`;
- RLS state/policies;
- trigger inventory;
- row counts for canonical tables;
- card sequence state;
- migration history.

### T1 — Candidate preflight

Abort if:

- required parent tables are missing;
- expected canonical objects already exist with incompatible definitions;
- function signatures differ;
- trigger attachments differ unexpectedly;
- existing test-only data would be destroyed;
- migration history contains an incompatible replay candidate.

### T2 — Schema candidate validation

Validate, without production access:

- `referee_card_counters` uniqueness and seed contract;
- `referee_contacts` ownership boundary;
- `public_application_settings` public-safe allowlist;
- notification tables and foreign keys;
- idempotency unique constraints.

### T3 — Function boundary validation

Expected browser boundary:

**Anonymous:**
- public referee lookup functions;
- bounded card verification only.

**Authenticated:**
- self event count;
- authorized assignment transition.

**Denied:**
- internal helpers;
- notification claim/finalize functions;
- provider/webhook persistence functions;
- privileged reporting without an explicit caller contract.

### T4 — RLS validation

Expected:

- notification tables: browser deny;
- `referee_card_counters`: browser deny;
- `public_application_settings`: authenticated SELECT only;
- `referee_contacts`: authenticated own-row boundary;
- private system/log tables: browser deny.

### T5 — Business-rule tests

Test cases:

1. anonymous public referee lookup succeeds only for approved/public-safe projection;
2. anonymous card verification succeeds only with bounded public output;
3. authenticated referee can retrieve only own event count;
4. authenticated caller cannot query another referee's event count;
5. unauthorized role cannot transition assignment;
6. regional admin cannot cross region;
7. cancellation without reason is rejected;
8. internal notification claim cannot be invoked by browser roles;
9. duplicate notification intent is idempotent;
10. provider delivery ledger rejects duplicate idempotency key;
11. historical card gap remains preserved;
12. historical cancellation exceptions remain unchanged.

## 4. Special Test: verify_referee_card

The candidate must verify that the response does not expose:

- card UUID;
- referee UUID;
- verification counter;
- internal created/updated timestamps;
- implementation metadata.

Concurrent verification must use atomic counter semantics.

## 5. Special Test: card numbering

Production baseline remains authoritative:

- 2026/730 max 38;
- 2026/731 max 77;
- 2026/732 max 15;
- 2026/737 max 54 with sequence 0040 absent;
- 2026/XXX max 3.

Test must not use `COUNT(*)` as the production counter seed.

## 6. Special Test: historical cancellation

The six known Production historical cancelled assignments without a reason are legacy exceptions.

Test migration must not introduce a constraint that retroactively rejects equivalent historical data.

Future cancelled transitions must require a non-empty reason.

## 7. No Production operations

Phase 1.8P does not authorize:

- Production `apply_migration`;
- Production DDL;
- Production DML;
- provider calls;
- secret reads;
- deployment.

## 8. Gate criteria

Phase 1.8P can PASS only if all required Test assertions pass and no incompatible Test-only canonical object is overwritten.

A Test PASS does not automatically authorize Production. Production must still pass a separate final preflight against its live catalog and migration history.

## 9. Current Gate

**BLOCKED — isolated Test validation is the next controlled execution stage, but candidate SQL must first be frozen and independently reviewed.**

## Safety counters

Production mutation: 0  
Test mutation: 0  
DDL: 0  
DML: 0  
Migration applied: 0  
Deployment: 0  
Provider calls: 0  
Secret reads: 0

## Next

**PHASE 1.8Q — Test Candidate SQL Freeze & Controlled Dry-Run Gate**
