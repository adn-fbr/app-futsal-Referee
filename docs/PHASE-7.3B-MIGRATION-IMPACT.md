# PHASE-7.3B Migration Impact

Version: v1.0.0
Status: PASS

| Blocker | Repository migration | Authentication | Authorization | RLS | RPC contract | Data model | System settings | Dynamic access | Security boundary | Impact |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B-001 `increment_view_count` | Discussion repository must defer this method | Authenticated discussion caller expected | Topic access and function grants require review | Discussion-topic policy dependency | Exact function exists only in historical migration | Updates `discussion_topics.views_count` | No | No | SECURITY DEFINER/search path review | HIGH |
| B-002 `public_system_settings` read | Settings repository needs explicit view decision | Authenticated caller in migration policy | View grants and filtered keys | `security_invoker` view and table policy | No | Reads settings projection | Direct | No | Prevent secret exposure | HIGH |
| B-003 `public_system_settings` filtered read | Same as B-002 | Authenticated caller | Key filter and view grants | Same as B-002 | No | Reads one setting | Direct | No | Prevent secret exposure | HIGH |
| B-004 dynamic soft delete | Replace generic call with domain methods during migration | Authenticated user required | Role/region/ownership checks | Four target-table policies | No | Sets `deleted_at` | No | Yes, closed canonical set | Prevent cross-domain arbitrary update | CRITICAL |
| B-005 dynamic restore | Replace generic call with domain methods during migration | Authenticated user required | Role/region/ownership checks | Four target-table policies | No | Clears `deleted_at` | No | Yes, closed canonical set | Prevent unauthorized restore | CRITICAL |

## Security decision

No blocker is cleared by a client-side check. The dynamic set is resolved because its values are statically closed and canonical, but update authorization remains a server/database responsibility. `increment_view_count` must not be recreated or called through a newly invented contract. Settings access must retain the filtered view boundary and must not expose secret keys.
