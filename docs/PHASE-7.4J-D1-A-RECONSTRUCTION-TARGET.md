# PHASE 7.4J-D1-A RECONSTRUCTION TARGET

## Canonical target summary

Use the Production canonical baseline and the dependency graph as the authoritative reconstruction target.

- Tables: 27
- Columns: 249
- Functions: 47
- Views: 3
- Triggers: 22
- Indexes: 47
- RLS Policies: 86
- Extensions: 7
- Enum Types: 2

## Target object constraints

Do not invent additional application objects.

The reconstruction target must preserve canonical behavior for:

- Events schema including deleted_at
- events.kabupaten_kota_id foreign key to kabupaten_kota.id
- duplicate event check function public.check_duplicate_event(text,text,text)
- canonical RLS behavior
- canonical dependency ordering

## Non-Production target

- shorsqyycpptxcutrqrb

## Production exclusion

- xfscfjwapwnkiinkgbjg remains outside the execution boundary.

No use of Production credentials, Production schema, or Production metadata may be used in execution.
