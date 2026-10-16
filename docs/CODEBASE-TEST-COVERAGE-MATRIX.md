# Test Coverage Matrix

| Module | Unit | Component/static | Integration/RLS | Browser | Coverage status |
|---|---|---|---|---|---|
| Auth/Profile/Role | PASS for repository/auth helpers | PARTIAL | BLOCKED | MISSING | critical integration gap |
| Events | PARTIAL | PARTIAL | MISSING | MISSING | no contract/runtime CRUD proof |
| Event Assignments | PASS static contracts | PASS static contracts | BLOCKED | BLOCKED | critical workflow without live test |
| Referees/Cards | PARTIAL | PARTIAL | MISSING | MISSING | RPC/RLS unverified |
| Reviews | PARTIAL | PARTIAL | MISSING | MISSING | public abuse/error flows absent |
| Evaluations | PARTIAL | PARTIAL | MISSING | MISSING | form interactions unverified |
| Honors | PARTIAL | PARTIAL | MISSING | MISSING | mutation/verification absent |
| Learning | PARTIAL | PARTIAL | MISSING | MISSING | list/detail/error absent |
| Discussions | PARTIAL | PARTIAL | BLOCKED by schema gap | MISSING | increment view contract unresolved |
| Organization/Settings | PARTIAL | PARTIAL | BLOCKED by contract gaps | MISSING | static/legacy data risk |
| Notifications | PARTIAL | MISSING delivery integration | MISSING | MISSING | Edge Function delivery not proven |
| Export/Import | PARTIAL | PASS seed exclusion | MISSING | MISSING | privileged function workflows unverified |
| Reports/Analytics | PARTIAL | MISSING data-shape tests | MISSING | MISSING | aggregate contract risk |
| User Management | PARTIAL | PARTIAL | MISSING | MISSING | privileged operations unverified |
| Orphan pages | NONE | NONE | NONE | NONE | no route/test evidence |

Current local evidence: 9 test files, 26 tests; TypeScript and build pass; lint is pre-existing 66/11. Browser, RLS, mutation, and fixture tests are absent or blocked.
