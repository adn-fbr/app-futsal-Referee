# PHASE-7.1 Credential Security Recovery

## Credential status

| Item | Result |
| --- | --- |
| Previously exposed service-role credential | YES |
| Rotation required | YES |
| Rotation executed | NO |
| Rotation authority available to this run | NO |
| Operator action required | YES |
| Browser service-role credential | NONE in safe-configuration generated bundle |
| Safe browser public credential | MISSING |
| Browser authentication runtime | BLOCKED |

## Completed recovery actions

- Replaced local browser configuration with placeholders; real credentials are absent.
- Added a safe .env.example with placeholders only.
- Stopped tracking .env and added environment files to .gitignore.
- Kept VITE_SUPABASE_PUBLISHABLE_KEY as the only browser credential input.
- Client code rejects JWTs with a service_role claim before creating the browser client.
- Vite rejects both a service-role browser environment value and any generated browser bundle containing a service-role JWT.
- Restored index.html to the application source entry point; it no longer imports historical static JavaScript artifacts.
- Confirmed server-side Edge Functions use environment-only service-role variables; those references are not browser imports.

## Local history and artifact scan

- Current active source/config scan found no JWT-shaped credential. A safe-config production build and bundle scan found zero JWT-shaped credentials.
- Local Git history contains at least one historical credential-pattern match. History was not rewritten because that destructive operation requires explicit repository-owner authorization and coordinated credential rotation.
- Catalog evidence can legitimately contain the text service_role as a database grant/role name. It is not itself a credential.

## Operator action required

1. Revoke/rotate the previously exposed service-role key in the Supabase dashboard.
2. Remove the secret from any CI/deployment variable, shell history, artifact store, or external clone that received it.
3. Issue a publishable key, or legacy anon key if applicable, and configure it only through secure local/CI environment storage.
4. Verify deployed bundles after a fresh deployment; deployment remains out of scope for this phase.
