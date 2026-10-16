-- PHASE 1.8E.6-B
-- PRODUCTION-CATALOG-EXTRACTION
--
-- Purpose: metadata-only PostgreSQL runtime catalog extraction.
-- Execute this file in an authorized production SQL console only after confirming
-- the session is read-only. Every statement below is a SELECT against PostgreSQL
-- catalogs, information_schema, or metadata-only pg_get_* functions.
--
-- Safety boundary:
--   BEGIN;
--   SET TRANSACTION READ ONLY;
--   -- execute this file
--   ROLLBACK;
--
-- Do not replace these queries with application-table SELECTs. Do not execute
-- application routines. Preserve each labelled result set as evidence.
-- Managed schemas to exclude from application baseline reconstruction:
-- auth, storage, realtime, vault, graphql, graphql_public, pgbouncer,
-- pg_catalog, information_schema, pg_toast, and other internal schemas.

/* 01 - DATABASE / SERVER METADATA -> metadata */
SELECT
  'metadata' AS result_set,
  current_database() AS database_name,
  current_user AS current_user_name,
  session_user AS session_user_name,
  current_schema() AS current_schema_name,
  current_setting('server_version') AS server_version,
  current_setting('server_version_num') AS server_version_num,
  current_setting('transaction_read_only') AS transaction_read_only,
  current_setting('default_transaction_read_only') AS default_transaction_read_only,
  current_setting('server_encoding') AS server_encoding,
  db.datcollate AS lc_collate,
  db.datctype AS lc_ctype
FROM pg_catalog.pg_database AS db
WHERE db.datname = current_database();

/* 02 - SCHEMAS -> schemas */
SELECT
  'schemas' AS result_set,
  n.oid AS schema_oid,
  n.nspname AS schema_name,
  pg_get_userbyid(n.nspowner) AS owner_name,
  n.nspacl AS schema_acl,
  obj_description(n.oid, 'pg_namespace') AS comment
FROM pg_catalog.pg_namespace AS n
WHERE n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
ORDER BY n.nspname;

/* 03 - TABLES / PARTITIONS / REPLICA IDENTITY -> tables */
SELECT
  'tables' AS result_set,
  c.oid AS relation_oid,
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relkind,
  c.relpersistence AS persistence,
  pg_get_userbyid(c.relowner) AS owner_name,
  c.relrowsecurity,
  c.relforcerowsecurity,
  c.relispartition,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'
    WHEN 'i' THEN 'INDEX'
    ELSE c.relreplident::text
  END AS replica_identity,
  pg_get_expr(c.relpartbound, c.oid, true) AS partition_bound,
  parent_ns.nspname AS parent_schema_name,
  parent.relname AS parent_table_name,
  obj_description(c.oid, 'pg_class') AS comment
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_inherits AS inh ON inh.inhrelid = c.oid
LEFT JOIN pg_catalog.pg_class AS parent ON parent.oid = inh.inhparent
LEFT JOIN pg_catalog.pg_namespace AS parent_ns ON parent_ns.oid = parent.relnamespace
WHERE c.relkind IN ('r', 'p', 'f', 'm')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
ORDER BY n.nspname, c.relname, c.oid;

/* 04 - COLUMNS / DEFAULTS / TYPES -> columns */
SELECT
  'columns' AS result_set,
  a.attrelid AS relation_oid,
  n.nspname AS schema_name,
  c.relname AS table_name,
  a.attnum AS ordinal_position,
  a.attname AS column_name,
  a.atttypid AS type_oid,
  format_type(a.atttypid, a.atttypmod) AS formatted_type,
  typ_ns.nspname AS type_schema_name,
  typ.typname AS internal_type_name,
  CASE WHEN typ.typtype = 'd' THEN format_type(typ.typbasetype, typ.typtypmod) END AS domain_base_type,
  a.attnotnull AS not_null,
  a.attidentity AS identity_generation,
  a.attgenerated AS generated_kind,
  pg_get_expr(ad.adbin, ad.adrelid, true) AS default_expression,
  CASE WHEN a.attgenerated = 's' THEN pg_get_expr(ad.adbin, ad.adrelid, true) END AS generated_expression,
  coll_ns.nspname AS collation_schema_name,
  coll.collname AS collation_name,
  ic.character_maximum_length,
  ic.numeric_precision,
  ic.numeric_scale,
  ic.datetime_precision,
  ic.character_set_name,
  ic.udt_schema,
  ic.udt_name,
  ic.domain_schema,
  ic.domain_name,
  ic.is_updatable,
  col_description(a.attrelid, a.attnum) AS comment
FROM pg_catalog.pg_attribute AS a
JOIN pg_catalog.pg_class AS c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_type AS typ ON typ.oid = a.atttypid
JOIN pg_catalog.pg_namespace AS typ_ns ON typ_ns.oid = typ.typnamespace
LEFT JOIN pg_catalog.pg_attrdef AS ad
  ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
LEFT JOIN pg_catalog.pg_collation AS coll ON coll.oid = a.attcollation
LEFT JOIN pg_catalog.pg_namespace AS coll_ns ON coll_ns.oid = coll.collnamespace
LEFT JOIN information_schema.columns AS ic
  ON ic.table_schema = n.nspname
 AND ic.table_name = c.relname
 AND ic.ordinal_position = a.attnum
WHERE a.attnum > 0
  AND NOT a.attisdropped
  AND c.relkind IN ('r', 'p', 'f', 'm', 'v', 'c')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname, a.attnum;

/* 05 - ALL CONSTRAINTS -> constraints */
SELECT
  'constraints' AS result_set,
  con.oid AS constraint_oid,
  n.nspname AS schema_name,
  rel.relname AS table_name,
  con.conname AS constraint_name,
  con.contype,
  con.convalidated AS validated,
  con.condeferrable AS deferrable,
  con.condeferred AS initially_deferred,
  pg_get_constraintdef(con.oid, true) AS definition,
  pg_get_expr(con.conbin, con.conrelid, true) AS check_expression,
  ARRAY(
    SELECT att.attname
    FROM unnest(con.conkey) WITH ORDINALITY AS key(attnum, ordinal)
    JOIN pg_catalog.pg_attribute AS att
      ON att.attrelid = con.conrelid AND att.attnum = key.attnum
    ORDER BY key.ordinal
  ) AS local_columns,
  ref_ns.nspname AS referenced_schema_name,
  ref.relname AS referenced_table_name,
  ARRAY(
    SELECT att.attname
    FROM unnest(con.confkey) WITH ORDINALITY AS key(attnum, ordinal)
    JOIN pg_catalog.pg_attribute AS att
      ON att.attrelid = con.confrelid AND att.attnum = key.attnum
    ORDER BY key.ordinal
  ) AS referenced_columns,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' ELSE con.confdeltype::text
  END AS on_delete,
  CASE con.confupdtype
    WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' ELSE con.confupdtype::text
  END AS on_update
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
LEFT JOIN pg_catalog.pg_class AS ref ON ref.oid = con.confrelid
LEFT JOIN pg_catalog.pg_namespace AS ref_ns ON ref_ns.oid = ref.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, rel.relname, con.conname, con.oid;

/* 06 - FOREIGN KEY ORDINAL MAPPING -> foreign_keys */
SELECT
  'foreign_keys' AS result_set,
  con.oid AS constraint_oid,
  n.nspname AS schema_name,
  rel.relname AS table_name,
  con.conname AS constraint_name,
  local_key.ordinality AS column_ordinal,
  local_att.attname AS local_column,
  ref_att.attname AS referenced_column,
  ref_ns.nspname AS referenced_schema_name,
  ref.relname AS referenced_table_name,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS local_key(attnum, ordinality) ON true
JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS ref_key(attnum, ordinality)
  ON ref_key.ordinality = local_key.ordinality
JOIN pg_catalog.pg_attribute AS local_att
  ON local_att.attrelid = con.conrelid AND local_att.attnum = local_key.attnum
JOIN pg_catalog.pg_attribute AS ref_att
  ON ref_att.attrelid = con.confrelid AND ref_att.attnum = ref_key.attnum
JOIN pg_catalog.pg_class AS ref ON ref.oid = con.confrelid
JOIN pg_catalog.pg_namespace AS ref_ns ON ref_ns.oid = ref.relnamespace
WHERE con.contype = 'f'
ORDER BY n.nspname, rel.relname, con.conname, local_key.ordinality;

/* 07 - INDEXES -> indexes */
SELECT
  'indexes' AS result_set,
  idx.indexrelid AS index_oid,
  idx.indrelid AS table_oid,
  n.nspname AS schema_name,
  tbl.relname AS table_name,
  index_ns.nspname AS index_schema_name,
  index_rel.relname AS index_name,
  am.amname AS access_method,
  idx.indisunique AS is_unique,
  idx.indisprimary AS is_primary,
  idx.indisexclusion AS is_exclusion,
  idx.indisvalid AS is_valid,
  idx.indisready AS is_ready,
  idx.indnkeyatts AS key_column_count,
  idx.indnatts AS total_column_count,
  pg_get_indexdef(idx.indexrelid) AS definition,
  pg_get_expr(idx.indexprs, idx.indrelid, true) AS expressions,
  pg_get_expr(idx.indpred, idx.indrelid, true) AS predicate,
  index_rel.reloptions AS storage_parameters
FROM pg_catalog.pg_index AS idx
JOIN pg_catalog.pg_class AS tbl ON tbl.oid = idx.indrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = tbl.relnamespace
JOIN pg_catalog.pg_class AS index_rel ON index_rel.oid = idx.indexrelid
JOIN pg_catalog.pg_namespace AS index_ns ON index_ns.oid = index_rel.relnamespace
JOIN pg_catalog.pg_am AS am ON am.oid = index_rel.relam
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND index_ns.nspname NOT LIKE 'pg_toast%'
ORDER BY n.nspname, tbl.relname, index_rel.relname, idx.indexrelid;

/* 08 - SEQUENCES -> sequences */
SELECT
  'sequences' AS result_set,
  c.oid AS sequence_oid,
  n.nspname AS schema_name,
  c.relname AS sequence_name,
  pg_get_userbyid(c.relowner) AS owner_name,
  s.seqtypid AS type_oid,
  format_type(s.seqtypid, NULL) AS data_type,
  s.seqstart AS start_value,
  s.seqmin AS minimum_value,
  s.seqmax AS maximum_value,
  s.seqincrement AS increment,
  s.seqcycle AS cycle,
  s.seqcache AS cache,
  dep_ns.nspname AS owned_by_schema_name,
  dep_rel.relname AS owned_by_table_name,
  dep_att.attname AS owned_by_column_name,
  obj_description(c.oid, 'pg_class') AS comment
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_sequence AS s ON s.seqrelid = c.oid
LEFT JOIN pg_catalog.pg_depend AS dep
  ON dep.classid = 'pg_class'::regclass
 AND dep.objid = c.oid
 AND dep.deptype = 'a'
LEFT JOIN pg_catalog.pg_class AS dep_rel ON dep_rel.oid = dep.refobjid
LEFT JOIN pg_catalog.pg_namespace AS dep_ns ON dep_ns.oid = dep_rel.relnamespace
LEFT JOIN pg_catalog.pg_attribute AS dep_att
  ON dep_att.attrelid = dep.refobjid AND dep_att.attnum = dep.refobjsubid
WHERE c.relkind = 'S'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname;

/* 09 - ENUMS AND OTHER CUSTOM TYPES -> types */
SELECT
  'types' AS result_set,
  typ.oid AS type_oid,
  n.nspname AS schema_name,
  typ.typname AS type_name,
  typ.typtype,
  typ.typcategory,
  typ.typisdefined,
  typ.typnotnull,
  format_type(typ.typbasetype, typ.typtypmod) AS base_type,
  pg_get_expr(typ.typdefaultbin, 0, true) AS type_default,
  obj_description(typ.oid, 'pg_type') AS comment,
  COALESCE(
    ARRAY(
      SELECT enum.enumlabel
      FROM pg_catalog.pg_enum AS enum
      WHERE enum.enumtypid = typ.oid
      ORDER BY enum.enumsortorder
    ), ARRAY[]::text[]
  ) AS enum_labels
FROM pg_catalog.pg_type AS typ
JOIN pg_catalog.pg_namespace AS n ON n.oid = typ.typnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND typ.typtype IN ('e', 'd', 'c')
ORDER BY n.nspname, typ.typname, typ.oid;

/* 10 - DOMAINS AND DOMAIN CONSTRAINTS -> domains */
SELECT
  'domains' AS result_set,
  typ.oid AS domain_oid,
  n.nspname AS schema_name,
  typ.typname AS domain_name,
  format_type(typ.typbasetype, typ.typtypmod) AS base_type,
  typ.typnotnull AS not_null,
  pg_get_expr(typ.typdefaultbin, 0, true) AS default_expression,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid, true) AS constraint_definition,
  con.convalidated AS validated
FROM pg_catalog.pg_type AS typ
JOIN pg_catalog.pg_namespace AS n ON n.oid = typ.typnamespace
LEFT JOIN pg_catalog.pg_constraint AS con ON con.contypid = typ.oid
WHERE typ.typtype = 'd'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, typ.typname, con.conname NULLS FIRST;

/* 11 - FUNCTIONS -> functions */
SELECT
  'functions' AS result_set,
  p.oid AS routine_oid,
  n.nspname AS schema_name,
  p.proname AS routine_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS result_type,
  p.proargnames AS argument_names,
  p.proargmodes AS argument_modes,
  p.proallargtypes AS argument_type_oids,
  p.proargtypes::oid[] AS input_argument_type_oids,
  p.prokind AS routine_kind,
  CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' WHEN 'v' THEN 'VOLATILE' END AS volatility,
  CASE p.proparallel WHEN 's' THEN 'SAFE' WHEN 'r' THEN 'RESTRICTED' WHEN 'u' THEN 'UNSAFE' END AS parallel_safety,
  p.prosecdef AS security_definer,
  p.proleakproof AS leakproof,
  p.proisstrict AS strict,
  l.lanname AS language,
  pg_get_userbyid(p.proowner) AS owner_name,
  p.proconfig AS configuration,
  p.proacl AS routine_acl,
  pg_get_functiondef(p.oid) AS definition,
  obj_description(p.oid, 'pg_proc') AS comment
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_language AS l ON l.oid = p.prolang
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prokind = 'f'
ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid), p.oid;

/* 12 - PROCEDURES -> procedures */
SELECT
  'procedures' AS result_set,
  p.oid AS routine_oid,
  n.nspname AS schema_name,
  p.proname AS routine_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_arguments(p.oid) AS arguments,
  p.proargnames AS argument_names,
  p.proargmodes AS argument_modes,
  p.proallargtypes AS argument_type_oids,
  CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' WHEN 'v' THEN 'VOLATILE' END AS volatility,
  CASE p.proparallel WHEN 's' THEN 'SAFE' WHEN 'r' THEN 'RESTRICTED' WHEN 'u' THEN 'UNSAFE' END AS parallel_safety,
  p.prosecdef AS security_definer,
  p.proleakproof AS leakproof,
  p.proisstrict AS strict,
  l.lanname AS language,
  pg_get_userbyid(p.proowner) AS owner_name,
  p.proconfig AS configuration,
  p.proacl AS routine_acl,
  pg_get_functiondef(p.oid) AS definition,
  obj_description(p.oid, 'pg_proc') AS comment
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_language AS l ON l.oid = p.prolang
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prokind = 'p'
ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid), p.oid;

/* 13 - VIEWS -> views */
SELECT
  'views' AS result_set,
  c.oid AS view_oid,
  n.nspname AS schema_name,
  c.relname AS view_name,
  pg_get_userbyid(c.relowner) AS owner_name,
  pg_get_viewdef(c.oid, true) AS definition,
  c.reloptions AS options,
  obj_description(c.oid, 'pg_class') AS comment
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname;

/* 14 - MATERIALIZED VIEWS -> materialized_views */
SELECT
  'materialized_views' AS result_set,
  c.oid AS materialized_view_oid,
  n.nspname AS schema_name,
  c.relname AS materialized_view_name,
  pg_get_userbyid(c.relowner) AS owner_name,
  c.relispopulated AS is_populated,
  c.reloptions AS options,
  obj_description(c.oid, 'pg_class') AS comment
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind = 'm'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname;

/* 15 - TRIGGERS / CONSTRAINT TRIGGERS -> triggers */
SELECT
  'triggers' AS result_set,
  t.oid AS trigger_oid,
  n.nspname AS schema_name,
  rel.relname AS table_name,
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_state,
  t.tgisinternal AS is_internal,
  t.tgconstraint AS constraint_oid,
  pg_get_triggerdef(t.oid, true) AS definition,
  proc_ns.nspname AS trigger_function_schema_name,
  proc.proname AS trigger_function_name,
  pg_get_function_identity_arguments(proc.oid) AS trigger_function_identity_arguments,
  t.tgargs AS trigger_arguments
FROM pg_catalog.pg_trigger AS t
JOIN pg_catalog.pg_class AS rel ON rel.oid = t.tgrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
JOIN pg_catalog.pg_proc AS proc ON proc.oid = t.tgfoid
JOIN pg_catalog.pg_namespace AS proc_ns ON proc_ns.oid = proc.pronamespace
WHERE NOT t.tgisinternal
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, rel.relname, t.tgname, t.oid;

/* 16 - RLS TABLE CONFIGURATION -> rls_table_configuration */
SELECT
  'rls_table_configuration' AS result_set,
  c.oid AS table_oid,
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity,
  c.relforcerowsecurity
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname;

/* 17 - RLS POLICIES -> rls */
SELECT
  'rls' AS result_set,
  p.policyname,
  p.schemaname AS schema_name,
  p.tablename AS table_name,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual AS using_expression,
  p.with_check AS with_check_expression
FROM pg_catalog.pg_policies AS p
WHERE p.schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY p.schemaname, p.tablename, p.policyname;

/* 18 - EXTENSIONS -> extensions */
SELECT
  'extensions' AS result_set,
  e.oid AS extension_oid,
  e.extname AS extension_name,
  e.extversion AS installed_version,
  n.nspname AS schema_name,
  e.extrelocatable AS relocatable,
  e.extconfig AS configured_relation_oids,
  e.extcondition AS configured_relation_conditions,
  obj_description(e.oid, 'pg_extension') AS comment
FROM pg_catalog.pg_extension AS e
JOIN pg_catalog.pg_namespace AS n ON n.oid = e.extnamespace
ORDER BY e.extname;

/* 19 - OWNERSHIP -> ownership */
SELECT
  'ownership' AS result_set,
  c.oid AS object_oid,
  n.nspname AS schema_name,
  c.relname AS object_name,
  CASE c.relkind
    WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned_table' WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized_view' WHEN 'S' THEN 'sequence' WHEN 'i' THEN 'index'
    WHEN 'f' THEN 'foreign_table' ELSE c.relkind::text
  END AS object_kind,
  pg_get_userbyid(c.relowner) AS owner_name
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
UNION ALL
SELECT
  'ownership' AS result_set,
  p.oid AS object_oid,
  n.nspname AS schema_name,
  p.proname AS object_name,
  CASE p.prokind WHEN 'f' THEN 'function' WHEN 'p' THEN 'procedure' ELSE p.prokind::text END AS object_kind,
  pg_get_userbyid(p.proowner) AS owner_name
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schema_name, object_kind, object_name, object_oid;

/* 20 - PRIVILEGES -> privileges */
SELECT
  'schema_privileges' AS result_set,
  n.nspname AS schema_name,
  pg_get_userbyid(acl.grantor) AS grantor,
  CASE acl.grantee
    WHEN 0 THEN 'PUBLIC'
    ELSE pg_get_userbyid(acl.grantee)
  END AS grantee,
  acl.privilege_type,
  acl.is_grantable
FROM pg_catalog.pg_namespace AS n
CROSS JOIN LATERAL aclexplode(
  COALESCE(n.nspacl, acldefault('n', n.nspowner))
) AS acl
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, grantee, privilege_type;

SELECT
  'table_privileges' AS result_set,
  grantee,
  table_schema AS schema_name,
  table_name,
  privilege_type,
  is_grantable,
  grantor
FROM information_schema.table_privileges
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, grantee, privilege_type;

SELECT
  'column_privileges' AS result_set,
  grantee,
  table_schema AS schema_name,
  table_name,
  column_name,
  privilege_type,
  is_grantable,
  grantor
FROM information_schema.column_privileges
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, column_name, grantee, privilege_type;

SELECT
  'routine_privileges' AS result_set,
  grantee,
  specific_schema AS schema_name,
  routine_name,
  specific_name,
  privilege_type,
  is_grantable,
  grantor
FROM information_schema.routine_privileges
WHERE specific_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY specific_schema, routine_name, specific_name, grantee, privilege_type;

/* 21 - DEPENDENCIES -> dependencies */
SELECT
  'dependencies' AS result_set,
  dep.classid::regclass::text AS dependent_catalog,
  dep.objid AS dependent_object_oid,
  dep.objsubid AS dependent_object_subid,
  dep.refclassid::regclass::text AS referenced_catalog,
  dep.refobjid AS referenced_object_oid,
  dep.refobjsubid AS referenced_object_subid,
  dep.deptype,
  dep_ns.nspname AS dependent_schema_name,
  dep_rel.relname AS dependent_relation_name,
  ref_ns.nspname AS referenced_schema_name,
  ref_rel.relname AS referenced_relation_name
FROM pg_catalog.pg_depend AS dep
LEFT JOIN pg_catalog.pg_class AS dep_rel
  ON dep.classid = 'pg_class'::regclass AND dep.objid = dep_rel.oid
LEFT JOIN pg_catalog.pg_namespace AS dep_ns ON dep_ns.oid = dep_rel.relnamespace
LEFT JOIN pg_catalog.pg_class AS ref_rel
  ON dep.refclassid = 'pg_class'::regclass AND dep.refobjid = ref_rel.oid
LEFT JOIN pg_catalog.pg_namespace AS ref_ns ON ref_ns.oid = ref_rel.relnamespace
WHERE COALESCE(dep_ns.nspname, ref_ns.nspname) NOT IN ('pg_catalog', 'information_schema')
ORDER BY dependent_catalog, dependent_object_oid, dependent_object_subid,
         referenced_catalog, referenced_object_oid, referenced_object_subid;

/* 22 - COMMENTS / METADATA -> comments */
SELECT
  'comments' AS result_set,
  'schema' AS object_kind,
  n.nspname AS schema_name,
  NULL::text AS object_name,
  obj_description(n.oid, 'pg_namespace') AS comment
FROM pg_catalog.pg_namespace AS n
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND obj_description(n.oid, 'pg_namespace') IS NOT NULL
UNION ALL
SELECT
  'comments' AS result_set,
  CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized_view' WHEN 'S' THEN 'sequence' ELSE c.relkind::text END,
  n.nspname,
  c.relname,
  obj_description(c.oid, 'pg_class')
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND obj_description(c.oid, 'pg_class') IS NOT NULL
UNION ALL
SELECT
  'comments' AS result_set,
  'column' AS object_kind,
  n.nspname,
  c.relname || '.' || a.attname,
  col_description(a.attrelid, a.attnum)
FROM pg_catalog.pg_attribute AS a
JOIN pg_catalog.pg_class AS c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE a.attnum > 0
  AND NOT a.attisdropped
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND col_description(a.attrelid, a.attnum) IS NOT NULL
UNION ALL
SELECT
  'comments' AS result_set,
  'routine' AS object_kind,
  n.nspname,
  p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
  obj_description(p.oid, 'pg_proc')
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND obj_description(p.oid, 'pg_proc') IS NOT NULL
ORDER BY schema_name, object_kind, object_name;

-- Conversion note:
-- Map each result_set to the corresponding top-level property in
-- PRODUCTION-CATALOG-EXTRACTION.json. Preserve returned arrays, NULL values,
-- PostgreSQL definitions, OIDs, signatures, ordering, and boolean states.
-- Do not include any result from an application-data query.
