# SECURITY TEST PLAN

## Objective

Create the minimum regression suite for auth and authorization integrity before new business features are added.

## Priority tests

### Test 1: unauthenticated access blocked

**Goal:** A user without a valid session cannot access protected routes or protected database functions.

**Check:**
- direct route access to protected pages
- direct call to privileged edge function without JWT

### Test 2: cross-tenant access blocked

**Goal:** A user from one region cannot read or mutate another region’s records.

**Check:**
- query by `kabupaten_kota_id` mismatch
- update of `profiles` or `events` outside tenant scope

### Test 3: role escalation blocked

**Goal:** A user cannot assign or claim a more privileged role without server validation.

**Check:**
- manual role update attempt via API or database function
- direct insertion into `user_roles` with elevated role

### Test 4: unauthorized mutation blocked

**Goal:** A user cannot modify records they do not own or do not have permission for.

**Check:**
- event update
- assignment mutation
- approval update
- settings mutation

### Test 5: referee cannot perform admin actions

**Goal:** The `wasit` role cannot access admin-only pages or functions.

**Check:**
- route guard and service call rejection

### Test 6: locked workflow cannot be modified

**Goal:** Business state transitions must respect explicit workflow constraints.

**Check:**
- update from locked state to active without override
- approval or assignment in locked contexts

### Test 7: privileged edge function requires valid identity

**Goal:** server-side authorization must resolve user identity from the authenticated session.

**Check:**
- missing authorization header
- malformed token
- user with valid session but missing required role

### Test 8: authorized user allowed to act within scope

**Goal:** valid users keep the ability to perform intended operations.

**Check:**
- admin_provinsi can approve registration within scope
- admin_kab_kota can manage region-scoped resources
- panitia can handle event submission within scope

### Test 9: tenant isolation remains after mutation

**Goal:** changes do not leak data across tenant boundaries.

**Check:**
- add/update/delete in region A does not expose region B records

### Test 10: RLS blocks unauthorized database access

**Goal:** database layer remains the final enforcement boundary.

**Check:**
- direct `supabase` access with mismatched tenant or role

## Execution guidance

This should be implemented in the same test stack already present in the repository via Vitest, as configured in [vitest.config.ts](../../vitest.config.ts).

## Important rule

Do not test mock-only behavior. These tests must validate actual authz behavior and DB access patterns, not UI-only controls.
