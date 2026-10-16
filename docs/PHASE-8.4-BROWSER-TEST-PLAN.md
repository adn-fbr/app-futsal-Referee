# Phase 8.4 Browser Test Plan

## Preconditions

Runtime must resolve to `shorsqyycpptxcutrqrb`; Production ref must be rejected. Synthetic Admin Provinsi, non-admin, and assignment fixtures must be approved. No real credentials.

## Scenarios

- Anonymous direct access to `/administration/event-assignments` redirects/blocks.
- Non-admin direct access and visible actions are denied.
- Admin Provinsi loads list, search, filter, detail, status dialog.
- Assignment success/loading/empty/error/retry states are distinct.
- Wrong step-up password leaves status and database unchanged.
- Correct password succeeds only after independent `user_roles` check.
- Rapid double-click and slow-network repeated submit produce one mutation.
- Refresh/revalidation shows persisted status and unchanged event/referee IDs.
- `/events/:id/assign-referees` CTA, mobile `/export`, and role-specific menu behavior remain correct.
- Run at 390px, 768px, and 1280px; then keyboard/focus/accessibility smoke checks.

## Evidence

Every scenario records route, synthetic role, action, expected/actual UI, request count, database effect, RLS result, and status. Never record passwords, tokens, or personal data.
