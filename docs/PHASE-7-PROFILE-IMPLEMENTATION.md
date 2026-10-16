# PHASE-7 Profile Implementation

SupabaseUserProfileRepository reads public.profiles by authenticated auth.users.id.

Only verified fields are selected:

- id
- full_name
- is_profile_complete
- kabupaten_kota_id
- registration_status
- requested_role

The resolution state is explicit: loading, ready, missing, or error. Missing profiles are shown as an account condition; no profile is inserted automatically. This preserves the baseline and avoids unauthorized Production mutation.

Gate 7.2: PASS.
