# PHASE 7.4E-G Critical Decisions

The following nine critical decisions require explicit human/authority decisions. None is approved by this record.

| Critical ID | Decision scope | Related decisions | Authority | Current status | Human decision |
|---|---|---|---|---|---|
| C01 | Function identity and signature | D01-D02 | Database/Architecture Owner | PENDING | blank |
| C02 | Return contract | D03 | Architecture and Database Owners | PENDING | blank |
| C03 | Matching semantics | D04 | Business/Product and Architecture Owners | PENDING | blank |
| C04 | Similarity and threshold | D05-D06 | Architecture, Business/Product Owners | PENDING | blank |
| C05 | Security execution model | D10-D11 | Security, Database, Architecture Owners | PENDING | blank |
| C06 | RLS behavior | D12 | Security and Database Owners | PENDING | blank |
| C07 | Data visibility scope | D13 | Business and Security Owners | PENDING | blank |
| C08 | Performance and index strategy | D14-D15 | Performance, Product, Database Owners | PENDING | blank |
| C09 | Migration and rollback authorization | D16-D19 | Database Governance, Architecture, Deployment Owners | PENDING | blank |

## Required Rule

If any critical decision is `PENDING`, `DEFER`, or `REJECT`, the final status remains **BLOCKED**. Contract approval never grants implementation or Production authorization automatically.

## Preserved Constraints

- Option C: **SEPARATE RESPONSIBILITIES**
- `public.check_duplicate_event(text,text,text) RETURNS boolean`: **UNCHANGED**
- No RLS bypass
- No invented tenant or organization scope
- No implementation, migration, index creation, deployment, or Production access in Phase 7.4E-G
