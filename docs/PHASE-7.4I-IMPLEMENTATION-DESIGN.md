# PHASE 7.4I — NON-PRODUCTION IMPLEMENTATION DESIGN

## Status

**PASS — DESIGN ONLY**

Execution readiness: **BLOCKED** until a safe non-Production environment and the TBD rich-search physical identity are explicitly supplied.

Frozen contract hash: `7ccbcced5b3ebfd74b5eb4e60c6c89c8f878a4a1162f312c51121ad6a7ed4bc6`

## Architecture

Preserve Option C:

`existing boolean existence check + separate rich candidate search + application wrapper`

The canonical `public.check_duplicate_event(text,text,text) RETURNS boolean` remains untouched. The active hook currently calls `check_duplicate_event` with five arguments, and a historical migration defines a conflicting five-argument `SECURITY DEFINER` function. That migration is evidence only and must not be adopted automatically.

Rich physical identity: **TBD / DESIGN REQUIRED**.

## Design Readiness

- Inputs: **READY**
- Outputs: **READY**
- Matching: **READY**
- Similarity: **READY — ranking only**
- Ordering: **READY**
- Limit: **READY — 5**
- NULL semantics: **READY**
- Error mapping: **READY**
- Security: **READY — SECURITY INVOKER**
- RLS: **EVIDENCE REQUIRED** before implementation
- Visibility: **READY — caller-authorized only**
- Performance: **EVIDENCE REQUIRED** before index/query tuning
- Database object identity: **DESIGN REQUIRED**
- Application inventory: **READY**
- Repository contract: **DESIGN REQUIRED**
- Test matrix: **READY**
- Rollback: **READY as procedure design**

## Non-Production Target

No safe non-Production project is identified. The configured Supabase project identifier must not be assumed to be non-Production. No connection or mutation was attempted.

Execution readiness is therefore **BLOCKED**, while the design artifact itself passes.

## Implementation Shape

`UI -> hook/service -> repository -> approved rich-search boundary`

No direct new business query should be introduced into UI components. The repository must expose the frozen business contract and map infrastructure errors to typed application errors.

## Safety

No source code, SQL, migration, database, Production environment, baseline, or deployment was changed or accessed.
