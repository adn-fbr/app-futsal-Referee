# UI/UX Gap Matrix

| ID | Module | Desktop | Tablet | Mobile | UI result | Evidence |
|---|---|---|---|---|---|---|
| UX-001 | Event Assignments | PARTIAL | PARTIAL | PARTIAL | table/card exists; live mutation, retry, accessibility unverified | 8.3B/8.3E |
| UX-002 | Events | PARTIAL | PARTIAL | PARTIAL | search/filter/loading/empty exist; query error/retry and runtime viewport unverified | Events.tsx, 8.3B |
| UX-003 | Referee Events | PARTIAL | PARTIAL | PARTIAL | cards and tabs exist; error/retry code added, browser validation absent | RefereeEvents.tsx |
| UX-004 | Forms | PARTIAL | PARTIAL | PARTIAL | many forms connected; consistent unsaved/error/keyboard behavior unverified | 8.3B form audit |
| UX-005 | Dialogs/step-up | PARTIAL | PARTIAL | PARTIAL | Radix dialogs and masked password; focus/keyboard/runtime behavior unverified | AdminEventAssignments.tsx |
| UX-006 | Tables | PARTIAL | PARTIAL | PARTIAL | raw tables/mobile cards; scope/caption/overflow checks absent | 8.3B accessibility/responsive |
| UX-007 | Navigation | PASS_STATIC | PASS_STATIC | PARTIAL | previous dead-link/role visibility gaps fixed statically; browser not tested | MobileNav.tsx, 8.3D |
| UX-008 | Design system | PARTIAL | PARTIAL | PARTIAL | tokens/primitives exist but repeated raw patterns drift | index.css/pages |
| UX-009 | Accessibility | PARTIAL | PARTIAL | PARTIAL | labels/Radix present; axe/keyboard/screen reader absent | 8.3B accessibility |
| UX-010 | Export/Import | PARTIAL | PARTIAL | PARTIAL | seed UI removed; export/import browser/error/permission flows unverified | DatabaseExport.tsx |

Overall UX classification: **PARTIAL**, not because pages are absent, but because runtime state, accessibility, and responsive evidence are incomplete.
