# PHASE-7.4B Governance Decision Required

Version: v1.0.0
Status: GOVERNANCE_DECISION_REQUIRED

## Decision authority

Required authority: database schema governance owner, application business owner for Event workflows, and security/RLS reviewer. Named approver: `TBD / GOVERNANCE REQUIRED`.

## Required decision

Choose one:

- Option A: adapt application behavior to the immutable boolean contract;
- Option B: approve a new five-argument duplicate-search contract;
- Option C: approve separate boolean and rich-search contracts;
- Option D: retire the application duplicate-search feature.

Recommended option: **C**, not authorized.

## Evidence required before Option B or C

All of the following must be approved and recorded:

- business requirement and acceptance criteria;
- function name and schema;
- exact identity signature and parameter semantics;
- exact return type and row visibility;
- authentication and authorization model;
- RLS and SECURITY DEFINER/search-path behavior;
- performance targets, indexes, limits, and query-plan evidence;
- backward compatibility and consumer rollout strategy;
- migration and rollback strategy;
- unit, contract, security, regression, and performance tests;
- new baseline revision, manifest, and dependency graph;
- deployment authorization and environment approval.

Unknown values remain `TBD / GOVERNANCE REQUIRED`. Historical SQL is not authorization.

## Hold

BATCH-01 EVENTS remains `BLOCKED`. Do not modify the current call-site, create a repository implementation for the five-argument contract, substitute the three-argument function, or add a workaround.
