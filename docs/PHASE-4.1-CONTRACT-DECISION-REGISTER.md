# PHASE 4.1 - Contract Decision Register

Status: **BLOCKED - OWNER CONTRACT DECISION REQUIRED**  
Mode: Contract resolution and test design only  
Production mutations: 0  
Test mutations: 0

This register separates **Product Decision**, **Security Evidence**, and **Remediation**. `UNKNOWN` is intentional and must not be converted into permission by frontend behavior.

## 1. Decision Register

| ID | Decision | Current evidence | Decision needed | Owner | Input/default safe position | Status |
|---|---|---|---|---|---|---|
| Q1 | License document view | Province-admin-only controls are observed; URL hooks run for any loaded detail; Storage behavior is unverified | Who may view license documents? | Product + Security + Data owner | `UNKNOWN`; do not broaden access | OPEN |
| Q2 | License document download | Province-admin-only controls are observed; signed download URL is 60 seconds; policy unverified | Who may download license documents? | Product + Security | `UNKNOWN`; do not broaden access | OPEN |
| Q3 | KTP view | KTP is sensitive; same unconditional signed URL request pattern | Who may view KTP documents? | Product + Security + Data owner | `UNKNOWN`; do not broaden access | OPEN |
| Q4 | KTP download | Download path exists; capability separation is not defined | Who may download KTP documents? | Product + Security | `UNKNOWN`; do not broaden access | OPEN |
| Q5 | RPC caller contract | Static SQL grants `anon`/`authenticated`; legacy public fallback present; live grants/behavior unverified | Is anonymous access required? Which authenticated roles may call list/count? | Backend + Security | Proposed safe contract: anon deny, admin roles only; not implemented | OPEN |
| Q6 | Region authorization | UI accepts region filter; source mutation targets arbitrary IDs; live RLS/RPC behavior unverified | Province scope, Kab/Kota own-region scope, and all operation boundaries | Backend + Security + Product | Proposed safe model: province all approved regions, Kab/Kota own region, others no admin access; not verified | OPEN |
| Q7 | Region name source | Current RPC/type omit `kabupaten_kota_name`; hook/UI expect it; historical migration includes it | RPC-returned name or separate approved lookup | Backend + Data owner | Keep `DATA-001 OPEN`; do not fabricate name | OPEN |
| Q8 | Detail projection | `profiles.select("*")`; UI uses a finite field set; exact live profile schema not verified | Approve minimum operational projection and document metadata separation | Data + Security + Backend | Minimum necessary fields only; no query change yet | OPEN |
| Q9 | Export field allowlist | Page-only export includes birth date and basic operational fields; serializer is unsafe | Approve fields, especially birth date, and safe CSV behavior | Product + Security + Data owner | Keep page-only scope; exclude documents/tokens/credentials | OPEN |
| Q10 | Account semantics | `is_active` is current account signal | Meaning of false, transition rules, and whether auto-deactivation exists | Product + Backend | Preserve `Aktif`/`Non-Aktif`; no new DB statuses | OPEN |
| Q11 | License expiry semantics | `license_expiry` date and current client-side 30-day filter | Timezone, inclusive boundary, expired behavior, automatic state effects | Product + Backend | Preserve current behavior; no new status values | OPEN |
| Q12 | Pending/suspended/revoked vocabulary | No authoritative referee status contract found; other domains have statuses | Whether these are real referee values or presentation-only concepts | Product + Backend | Do not introduce them | OPEN |
| Q13 | Audit event taxonomy | Existing `audit_logs`, `get_audit_logs`, and writers; referee paths not wired | Which edit/status/document/export/denial events are mandatory | Security + Product + Compliance | Reuse existing infrastructure; no parallel logger | OPEN |
| Q14 | Audit writer | Existing client writers; `writeAuditLog` hardcodes `entity_type: event` | Client versus server-side reliability and entity contract | Backend + Security | Server-side preferred for security events; not implemented | OPEN |
| Q15 | Performance threshold | Expiry and stats fetch unbounded data; no approved scale threshold | Thresholds across 10/100/500/1k/5k/10k rows and latency/bytes budget | Product + Backend | Do not add aggregate RPC yet | OPEN |
| Q16 | Fixture authorization | Guard requires non-production target, service-role key, and fixture password; readiness record says Auth capability unavailable | Authorize existing fixtures or approve controlled synthetic provisioning | Test owner + Security | No fixture creation or mutation | BLOCKED |
| Q17 | Document fixtures | No `LICENSE_A/KTP_A` or paired document fixture manifest found | Provide synthetic Storage objects and object-path map | Security + Test owner | No Storage reads/writes or inferred paths | BLOCKED |
| Q18 | Direct RPC test credentials | Role populations are historically documented, but exact actor bindings are not frozen | Provide authorized sessions/identifiers for anon/non-admin/admin roles | Test owner | No direct RPC execution | BLOCKED |

## 2. Product Decisions Required

The owner must decide Q1-Q4, Q9-Q12, and Q13-Q15. These define what the product should allow. They do not prove what Production currently allows.

## 3. Security Evidence Required

The backend/test owner must provide evidence for Q5-Q8 and Q16-Q18:

- live function grants and behavior;
- effective RLS and Storage policies;
- role/region actor bindings;
- direct RPC and object-access results;
- exact synthetic document fixture availability.

## 4. Remediation Boundary

Only after the product decision and security evidence agree may remediation be designed as implementation-ready. Until then:

- no Production mutation;
- no test fixture creation without explicit authorization;
- no RPC/RLS/Storage changes;
- no status or field invention;
- no claim that frontend visibility is authorization.

## 5. Gate

```text
CONTRACT REGISTER: COMPLETE
OWNER DECISIONS: PENDING
SECURITY EVIDENCE: INCOMPLETE
FIXTURES: NOT AVAILABLE / NOT AUTHORIZED
STATUS: BLOCKED - OWNER CONTRACT DECISION REQUIRED
```
