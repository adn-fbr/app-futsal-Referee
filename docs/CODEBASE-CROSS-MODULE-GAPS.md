# Cross-Module Gaps

1. **Repository architecture:** Auth has repositories; 17+ business modules use direct Supabase calls. This affects contract, RLS, error, caching, and testability across the application.
2. **Authorization policy duplication:** route guards, page visibility, hooks, and Edge Functions each contain role decisions. Assignment already showed CTA/route drift.
3. **RLS evidence:** all Supabase-backed modules lack current Non-Production identity tests; static policy artifacts are not runtime proof.
4. **Async UX:** loading/error/empty/retry patterns differ across pages; assignment/referee fixes are isolated rather than standardized.
5. **Contract governance:** duplicate event, discussion view count, settings view, and assignment transition/cache contracts cross multiple modules.
6. **Audit/notification coupling:** assignment status changes, cancellation audit, and referee notifications are distributed across hooks and functions.
7. **Testing infrastructure:** no browser harness, synthetic Auth fixture readiness, or reusable RLS integration harness.
8. **Governance inventory:** route/page/component/test counts differ between Phase 8.1, 8.3B, and current source.
9. **Privileged operations:** user administration, import/export, seed, reports, and notifications rely on Edge Functions with incomplete end-to-end authorization/delivery evidence.
10. **Production readiness:** code/build readiness exceeds integration/UAT readiness; this is systemic and cannot be solved by cosmetic page work.
