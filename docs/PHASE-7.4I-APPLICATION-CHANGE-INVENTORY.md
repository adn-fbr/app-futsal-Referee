# PHASE 7.4I Application Change Inventory

| File | Current responsibility | Required design change | Boundary | Risk | Test requirement |
|---|---|---|---|---|---|
| `src/hooks/useEvents.ts` | Direct five-argument RPC and wrapper | Move business call behind repository; typed errors; preserve wrapper | Hook -> repository | High | Input/error/result mapping |
| `src/pages/EventEdit.tsx` | Duplicate check before confirmation; fail-open catch | Consume typed errors; never map database failure to no duplicate | UI -> hook | High | Database, authorization, timeout |
| `src/components/events/DuplicateEventDialog.tsx` | Candidate rendering and score labels | Likely type-only adjustment; no new fields | Presentation | Low | Rendering and NULL score |
| `src/integrations/supabase/types.ts` | Generated conflicting RPC type | Regenerate only after approved identity exists; never hand-edit | Generated type | High | Generated contract check |
| Historical migration file | Conflicting five-argument SECURITY DEFINER evidence | No change; do not adopt automatically | Database evidence | Critical | Governance review |

No source file was modified. The required architecture remains `UI -> Hook/Service -> Repository -> Supabase`.
