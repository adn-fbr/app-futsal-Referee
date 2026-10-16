# PHASE B.2.2 — Frozen Actor & Fixture Contract

## Environment

TEST ONLY  
project_ref: `shorsqyycpptxcutrqrb`

The test environment selection was verified previously. This does not prove the identity of a live database connection.

## Database Identity

**BLOCKED**

No read-only database connection is available to execute the identity query. The live database project ref, `current_database()`, `current_user`, and server version are **NOT VERIFIED**. The supplied statement that candidates exist across regions is recorded as an unverified assertion, not as query evidence.

## Frozen Actors

No actor UUIDs or region values were obtained. No values are fabricated.

ADMIN_PROVINSI_ACTOR  
user_id: NOT VERIFIED  
kabupaten_kota_id: NOT VERIFIED

ADMIN_KAB_KOTA_ACTOR  
user_id: NOT VERIFIED  
kabupaten_kota_id: NOT VERIFIED  
ADMIN_KAB_KOTA_REGION: NOT VERIFIED

## Frozen Referees

No profile or role rows were queried; neither relationship can be frozen.

REFEREE_A  
user_id: NOT VERIFIED  
kabupaten_kota_id: NOT VERIFIED  
same_region_with_admin_kab_kota: NOT VERIFIED  
contact_row_exists: NOT VERIFIED  
assignment_row_exists: NOT VERIFIED

REFEREE_B  
user_id: NOT VERIFIED  
kabupaten_kota_id: NOT VERIFIED  
same_region_with_admin_kab_kota: NOT VERIFIED  
contact_row_exists: NOT VERIFIED  
assignment_row_exists: NOT VERIFIED

## Session Infrastructure

No approved authenticated sessions are available to this phase. Existing repository documentation says exact actor/session bindings are not frozen; the integration harness requires credential values, which were not read or used.

ADMIN_PROVINSI_SESSION: NOT AVAILABLE  
ADMIN_KAB_KOTA_SESSION: NOT AVAILABLE  
REFEREE_A_SESSION: NOT AVAILABLE

## Security Constraints

No credentials exposed.  
No tokens exposed.  
No production access.  
No mutations.  
No schema changes.

## Evidence Separation

### VERIFIED

- The intended test project ref is `shorsqyycpptxcutrqrb` in the previously verified test environment selection.
- No database connection was established in this phase.
- No database query, API request, actor impersonation, or fixture provisioning was performed.

### NOT VERIFIED

- Live database identity.
- Existing role counts and admin actor UUIDs.
- Admin kab/kota region UUID.
- Same-region Referee A and cross-region Referee B bindings.
- Contact-row and assignment-row existence for either referee.
- Authenticated sessions for any actor.
- The user-supplied assertion that candidate records exist across multiple regions.

### NEXT TEST

After a read-only connection to the test project is available and its identity is proven, inspect existing role/profile relationships and freeze only existing UUID bindings. Then obtain approved existing authenticated actor sessions before testing direct `profiles` SELECT, referee detail, `referee_contacts`, or assignment authorization. Do not create fixtures to satisfy this phase.

## Gate

`PHASE B.2.2 BLOCKED — AUTHENTICATED ACTOR SESSION REQUIRED`

The database identity, actor/fixture relationships, and approved sessions are not established. Database rows alone would not satisfy the session requirement. No authorization PASS is claimed.
