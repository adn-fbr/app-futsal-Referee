# PHASE 7.4J Migration Record

Status: **BLOCKED — NOT APPLIED**

- Target project: `shorsqyycpptxcutrqrb`
- Production project: `xfscfjwapwnkiinkgbjg`
- Migration draft: created, failed validation, then removed.
- Failure 1: `extract(day FROM date - date)` invalid because date subtraction returns integer.
- Failure 2: target `public.events` lacks `deleted_at`.
- Failure 3: target `public.events` lacks `kabupaten_kota_id`.
- Migration history repair was reverted after confirming later schema migrations were not applied.
- Final migration status: new 7.4J migration is not applied.

No Production migration was attempted.
