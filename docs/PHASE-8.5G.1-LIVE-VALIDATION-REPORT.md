# PHASE 8.5G.1 — LIVE NON-PRODUCTION EVENT ASSIGNMENT STATUS & STEP-UP VALIDATION

## FINAL GATE

**BLOCKED — CROSS-REGION RLS ISOLATION FAILED; BROWSER STEP-UP NOT PROVEN**

## EXECUTED EVIDENCE

- Non-Production target: `shorsqyycpptxcutrqrb`
- Authenticated server-side user-session checks: PASS for all four synthetic identities
- Admin Provinsi role read-back: PASS
- Assignment read: Admin Provinsi 2, Admin Kab/Kota A 2, Admin Kab/Kota B 2, Wasit 2
- `pending -> confirmed`: PASS
- referee `pending -> declined`: PASS
- `pending -> confirmed -> cancelled`: PASS
- All assignment fixtures restored to `pending`
- Audit read-back: PASS, 6 assignment audit records observed
- Production requests: 0

## BLOCKER

The authenticated Admin Kab/Kota A session could read and update the Region B assignment. The canonical policy uses `is_admin()`, and the canonical `is_admin()` function includes both `admin_provinsi` and `admin_kab_kota`. This is a real cross-region authorization failure, not a frontend filtering issue. No RLS/schema change was made in this phase.

The integrated browser page rendered the assignment route using an existing non-fixture session, so it is not accepted as synthetic-role or step-up evidence. Password step-up success/failure through the browser was not claimed.

## RESPONSIVE FIX

The assignment mobile cards had page overflow at 320/360/375/390/393 widths because card content and actions preserved intrinsic width. A minimal fix added `min-w-0`, `shrink-0`, and `break-words` to the mobile card/title/action layout. Re-measurement showed no horizontal overflow across all six mobile viewports.

## STATUS

- Auth: PARTIAL, authenticated API sessions PASS; browser fixture session NOT VERIFIED
- Role: PASS for Admin Provinsi read-back
- Region display/filter: PARTIAL, API graph valid; browser role-filter interaction NOT VALIDATED
- Status transitions: PASS for executed canonical paths
- Step-up: BLOCKED for browser proof; wrong-password Auth rejection PASS in server harness
- RLS: FAIL, cross-region leakage demonstrated
- Cross-region: FAIL
- Audit: PASS for observed assignment audit records
- Notification: NOT VALIDATED
- Responsive assignment page: PARTIAL, overflow fixed; authenticated browser interaction not proven

## REGRESSION

- TypeScript: PASS
- Tests: PASS, 16 files / 54 tests
- Build: PASS
- Lint: BASELINE FAIL, 68 errors / 12 warnings

No Production, schema, RLS, migration, or fixture-creation operation was performed in this phase.

## NEXT PHASE

Address the canonical authorization/RLS defect in a separately authorized schema/RLS phase, then rerun authenticated cross-region validation. Do not proceed to a PASS claim or browser step-up sign-off from this evidence.
