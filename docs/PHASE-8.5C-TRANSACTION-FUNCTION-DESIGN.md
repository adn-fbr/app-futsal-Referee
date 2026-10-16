# Phase 8.5C Transaction Function Design

## Status

**BLOCKED BEFORE IMPLEMENTATION**

The approved design remains one governed PostgreSQL function/RPC, preferably SECURITY INVOKER, that atomically inserts `events` and required `event_approvals` state. No function was created because the canonical event scope/parameter mismatch and idempotency contract are unresolved.

## Required logical contract

`authenticated identity + user_roles admin_provinsi + authorized scope + canonical event input -> event DIAJUKAN + approval pending`, committed atomically or rolled back completely.

## Required function behavior

- Validate authenticated caller and role/scope using canonical mechanisms.
- Perform canonical duplicate boolean check only after parameter mapping is approved.
- Insert event and approval in one PostgreSQL transaction context.
- Preserve existing statuses and audit trigger.
- Return safe canonical identifiers/status only.
- Never accept password as role authority or return secrets.
- Define idempotency before implementation.

## Why blocked

The canonical function parameter `p_kota_id` and body reference `events.kota_id`, but canonical `events` definition has `kabupaten_kota_id` and no `kota_id`. Implementing a function around this unresolved semantic mismatch would invent a mapping or alter canonical schema.
