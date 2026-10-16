# PHASE-7.4B Options Analysis

Version: v1.0.0

| Option | Business impact | Technical impact | Security / RLS | Performance | Migration complexity | Backward compatibility | Rollback | Baseline impact | Repository impact |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Adapt application to canonical boolean | Loses similarity details and current-event exclusion unless business accepts changed warning behavior | Simplifies call but requires application behavior change | Uses existing function grants/RLS assumptions; still needs authorization review | Likely lowest query cost | Medium: consumer and tests change | Breaking for current duplicate-search UX | Revert consumer change | None | Existing Event repository method changes |
| B. Evolve schema with five-argument search | Preserves current UX and historical semantics | Adds an approved function contract and likely new baseline revision | Requires explicit grants, SECURITY DEFINER/search-path review, RLS behavior, and input validation | Date/region/name search and ranking require query-plan evidence | High | Best for current application behavior if approved | Requires reversible migration and baseline revision | New revision required | Adds duplicate-search repository method |
| C. Split existence and rich search | Preserves canonical boolean capability and isolates richer behavior | Keeps current function stable; introduces separately governed search contract | Independent security/RLS review for each capability; least privilege is clearer | Callers choose cheap existence or richer search; search cost remains explicit | High | Strongest compatibility if both contracts are needed | Disable search contract while retaining boolean contract | New revision only for search contract | Two explicit repository methods |
| D. Retire application feature | Removes duplicate warning behavior and maintenance cost | Removes or disables consumer path in a later approved refactor | Reduces attack surface for the feature | Lowest runtime cost | Medium | Breaking for EventEdit users | Re-enable consumer if retained | None | Removes duplicate-search method |

## Recommendation

Recommend **Option C**, subject to governance. It avoids weakening the immutable boolean contract and avoids making one overloaded function carry two incompatible meanings. This is a recommendation only, not authorization.
