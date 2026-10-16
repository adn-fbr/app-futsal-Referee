# Phase 8.5E Remediation Options

No option is authorized in Phase 8.5E.

## R1: Repair canonical function body

Use `events.kabupaten_kota_id` only if semantic equivalence is explicitly proven. Then separately review SECURITY DEFINER versus INVOKER, fixed `search_path`, grants, NULL behavior, RLS disclosure, and exact matching. Current evidence does not satisfy that condition.

## R2: Replace canonical function contract

Appropriate only if the three-argument contract is proven semantically wrong. No such decision exists.

## R3: Deprecate duplicate function

Possible if duplicate validation belongs in a separately governed workflow. Requires explicit business ownership.

## R4: New rich duplicate-search contract

Historical UI needs records and similarity, but this must be a new governed identity. Do not overload or recreate `check_duplicate_event`.

## R5: Application-only adaptation

Possible only after canonical boolean semantics, parameter ownership, NULL behavior, visibility, and executable database body are approved.

## R6: Schema change

Required only if `kota_id` is proven to be a distinct business entity. No column or FK should be added speculatively.

Recommended next step: obtain a signed semantic owner decision, then authorize a separate controlled Non-Production remediation phase.
