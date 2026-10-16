# PHASE 7.4H Contract Invariants

1. `public.check_duplicate_event(text,text,text) RETURNS boolean` remains unchanged.
2. Rich duplicate search is a separate responsibility.
3. Rich-search physical identity, schema, signature, and return type remain TBD.
4. Exactly five observed application inputs are accounted for.
5. Similarity is ranking only; no numeric threshold is frozen.
6. Default ordering is `similarity_score DESC, date DESC`.
7. Default maximum result count is 5; pagination is not implied.
8. Required NULL or blank input is a validation error.
9. Database failure is never interpreted as no duplicate.
10. SECURITY INVOKER is required; SECURITY DEFINER is not authorized.
11. RLS remains enforced with no bypass.
12. Results are caller-authorized only.
13. No speculative index is authorized.
14. Production migration and deployment are not authorized.
15. The canonical baseline remains unchanged.
16. Contract changes require a new governance/contract decision and version.
