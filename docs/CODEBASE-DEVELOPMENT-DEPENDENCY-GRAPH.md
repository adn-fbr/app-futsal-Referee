# Development Dependency Graph

```mermaid
graph TD
  ENV[Non-Production runtime binding] --> FIX[Approved synthetic identities and fixtures]
  FIX --> AUTH[Auth/Profile/Role integration proof]
  AUTH --> RBAC[Capability matrix and direct URL tests]
  RBAC --> RLS[RLS read/update tests]
  RLS --> CONTRACT[Canonical RPC/schema reconciliation]
  CONTRACT --> REPO[Incremental domain repository boundaries]
  REPO --> ASSIGN[Event assignment integration workflow]
  ASSIGN --> CORE[Events, referees, evaluations, honors workflows]
  CORE --> UX[Responsive/accessibility/error UX]
  UX --> TEST[Browser/regression gates]
  TEST --> UAT[Production UAT decision]
  TEST --> SCALE[Performance/pagination measurement]
```

## Ordering

1. Keep runtime bound to Non-Production and provision approved fixture capability.
2. Validate Auth/Profile/Role and RLS identity boundaries.
3. Reconcile canonical contracts before introducing abstractions around broken calls.
4. Validate `event_assignments` end-to-end, including audit/notification/cache behavior.
5. Extract repositories incrementally from highest-risk domains, not as a rewrite.
6. Add browser/accessibility/error-state gates.
7. Only then optimize scale and build advanced features.
