# PHASE-7.4E-B Call-Site Inventory

Version: v1.0.0

## Application call-site

| File | Line | Function/method | Call |
| --- | ---: | --- | --- |
| `src/hooks/useEvents.ts` | 556 | `useCheckDuplicateEvent` mutation function | `supabase.rpc("check_duplicate_event", { p_name: name, p_date: date, p_location: location || null, p_kabupaten_kota_id: kabupatenKotaId || null, p_exclude_event_id: excludeEventId || null })` |

## Consumer path

| File | Line | Consumer behavior |
| --- | ---: | --- |
| `src/pages/EventEdit.tsx` | 35 | Creates `useCheckDuplicateEvent` mutation |
| `src/pages/EventEdit.tsx` | 87 | Runs duplicate check before confirmation |
| `src/pages/EventEdit.tsx` | 91-103 | Reads `isDuplicate`, array length, and first `name` |
| `src/pages/EventEdit.tsx` | 105 | Clears warning when no duplicates |
| `src/pages/EventEdit.tsx` | 106 | On error returns `true`, allowing edit to proceed |

Other repository-wide matches are definitions, generated types, historical SQL, bundled assets, or documentation; no second application runtime RPC call-site was found.

## Direct Supabase boundary

The operation bypasses a repository and calls Supabase directly from a hook. No repository implementation exists for this contract. No code was changed.
