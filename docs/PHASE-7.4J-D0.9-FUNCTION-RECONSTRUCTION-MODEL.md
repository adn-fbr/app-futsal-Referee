# PHASE 7.4J-D0.9 Function Reconstruction Model

Source: canonical `production-schema.sql`, baseline hash `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.

The canonical inventory contains 47 public function identities. Security is taken from each canonical declaration; `SECURITY DEFINER` functions require fixed-search-path and caller-boundary review, while `SECURITY INVOKER` functions preserve caller/RLS context.

| Identity | Return | Security/dependency classification |
|---|---|---|
| `auto_mark_expired_cards()` | json | DEFINER; card lifecycle |
| `can_access_region(uuid,uuid)` | boolean | DEFINER; Auth/region |
| `can_approve_registration(uuid,uuid)` | boolean | DEFINER; Auth/profile |
| `check_duplicate_event(text,text,text)` | boolean | DEFINER in baseline; frozen canonical contract |
| `count_referee_cards(text,text)` | bigint | INVOKER; cards |
| `count_referees(text,boolean,uuid,text)` | bigint | DEFINER; profiles/region |
| `generate_card_number(uuid)` | varchar | DEFINER; cards |
| `get_accessible_regions(uuid)` | SETOF uuid | DEFINER; Auth/region |
| `get_admin_dashboard_summary(uuid,date,date)` | TABLE | DEFINER; aggregate |
| `get_audit_logs(text,uuid,text,uuid,timestamptz,timestamptz,int,int)` | TABLE | DEFINER; audit |
| `get_honor_statistics(uuid)` | TABLE | DEFINER; honors |
| `get_my_referee_event_count(date,date)` | TABLE | DEFINER; events |
| `get_pending_registrations()` | TABLE | DEFINER; profiles |
| `get_public_referee(uuid)` | TABLE | DEFINER; public profile |
| `get_public_referees(text,boolean)` | TABLE | DEFINER; public profile |
| `get_referee_event_count(uuid,date,date)` | TABLE | DEFINER; events |
| `get_referee_income_summary(uuid,date,date)` | TABLE | DEFINER; honors |
| `get_referees(text,boolean,uuid,text,int,int)` | TABLE | DEFINER; profiles |
| `get_registration_history()` | TABLE | DEFINER; profiles |
| `get_user_kabupaten_kota(uuid)` | uuid | DEFINER; Auth/region |
| `get_user_kabupaten_kota_id(uuid)` | uuid | DEFINER; Auth/region |
| `handle_honor_verification()` | trigger | DEFINER; honors trigger |
| `handle_new_user()` | trigger | DEFINER; external Auth boundary |
| `has_role(uuid,app_role)` | boolean | DEFINER; Auth/RLS |
| `has_schedule_conflict(uuid,uuid)` | boolean | DEFINER; assignments |
| `is_admin(uuid)` | boolean | DEFINER; Auth/RLS |
| `is_admin_kab_kota(uuid)` | boolean | DEFINER; Auth/RLS |
| `is_admin_provinsi(uuid)` | boolean | DEFINER; Auth/RLS |
| `is_event_approved(uuid)` | boolean | DEFINER; approvals |
| `is_referee_active(uuid)` | boolean | DEFINER; profiles |
| `is_same_region(uuid,uuid)` | boolean | DEFINER; Auth/region |
| `log_event_approval()` | trigger | INVOKER; event audit trigger |
| `log_honor_verification()` | trigger | DEFINER; honor audit trigger |
| `log_referee_assignment()` | trigger | DEFINER; assignment audit trigger |
| `log_registration_approval()` | trigger | DEFINER; profile audit trigger |
| `prevent_hard_delete()` | trigger | DEFINER; soft-delete boundary |
| `search_referee_cards(text,text,int,int)` | TABLE | INVOKER; overloaded cards search |
| `search_referee_cards(text,boolean,text,int,int)` | TABLE | INVOKER; overloaded cards search |
| `set_updated_at()` | trigger | INVOKER; timestamp trigger |
| `soft_delete_record()` | trigger | DEFINER; soft-delete trigger |
| `sync_card_expiry()` | trigger | DEFINER; card trigger |
| `update_topic_reply_count()` | trigger | DEFINER; discussion trigger |
| `update_updated_at_column()` | trigger | INVOKER; timestamp trigger |
| `validate_honor_submission()` | trigger | DEFINER; honors validation |
| `validate_referee_assignment()` | trigger | DEFINER; assignment validation |
| `validate_regional_access()` | trigger | DEFINER; regional validation |
| `verify_referee_card(text)` | jsonb | DEFINER; card verification |

The canonical duplicate function remains unchanged. Rich duplicate search has no physical identity in this design and is not created. No function implementation SQL is generated or executed.