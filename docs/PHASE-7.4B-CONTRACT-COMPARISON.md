# PHASE-7.4B Contract Comparison

Version: v1.0.0

| Dimension | Current canonical contract | Application / historical contract | Gap |
| --- | --- | --- | --- |
| Identity | `public.check_duplicate_event(text,text,text)` | Five-argument `check_duplicate_event` from historical migration | Different identity |
| Parameters | `p_kota_id text`, `p_location text`, `p_name text` | `p_name text`, `p_date date`, optional location/region/exclusion text | Different count and semantics |
| Matching | Exact `kota_id`, location, and name | Name similarity, date proximity, optional location and region, exclusion | Materially different algorithm |
| Return | `boolean` from `EXISTS` | Rows: id, name, date, location, status, similarity_score | Incompatible return shape |
| Caller | Application hook line 556 | Same hook, consumed by EventEdit duplicate warning | Same consumer, incompatible contract |
| Evidence | Immutable baseline, production schema, dependency graph | Historical migration, generated types, source behavior | Two authoritative evidence classes conflict |
| RLS/security | Baseline function is `SECURITY DEFINER`; exact policy review required | Historical function also `SECURITY DEFINER`; search path and grants require review | Cannot inherit security assumptions |
| Compatibility | Current canonical behavior | Existing application behavior | Direct adaptation loses business behavior |

## Conclusion

The five-argument operation cannot be treated as a renamed call to the three-argument function. A governance decision is required to preserve, evolve, split, or retire the application capability.
