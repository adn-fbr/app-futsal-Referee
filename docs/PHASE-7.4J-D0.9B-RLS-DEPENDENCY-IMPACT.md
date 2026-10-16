# PHASE 7.4J-D0.9B RLS Dependency Impact

`AUTH_DEPENDENCY_RISK = HIGH`.

Canonical RLS covers identity and caller context across profiles, user_roles, pengurus, notifications, notification_preferences, learning_progress, discussion topics/replies, events, evaluations, assignments, referee cards/reviews, honors, and audit/auth event tables.

Auth user provenance is unresolved, `pengurus` is absent, and the remote schema is only a six-table partial subset. Therefore caller identity, role resolution, regional predicates, ownership predicates, and Auth-owned references cannot be validated for the future reconstruction target.

Future policy: canonical 86-policy baseline, RLS enforced, no privileged browser bypass, no invented authorization semantics. No RLS mutation occurred.