-- PRODUCTION-CATALOG-NORMALIZATION
-- Read-only catalog gate. Execute as one statement in a read-only session.

WITH
extension_members AS (
  SELECT d.classid, d.objid
  FROM pg_catalog.pg_depend AS d
  JOIN pg_catalog.pg_extension AS e
    ON d.refclassid = 'pg_catalog.pg_extension'::regclass
   AND d.refobjid = e.oid
  WHERE d.deptype = 'e'
),
schema_inventory AS (
  SELECT
    n.oid,
    n.nspname AS schema_name,
    pg_catalog.pg_get_userbyid(n.nspowner) AS owner,
    CASE
      WHEN n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM extension_members em
         WHERE em.classid = 'pg_catalog.pg_namespace'::regclass AND em.objid = n.oid
       ) THEN 'APPLICATION_CANDIDATE'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'POSTGRES_INTERNAL'
      ELSE 'NON_APPLICATION'
    END AS classification,
    CASE
      WHEN n.nspname = 'public' THEN 'application boundary'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'recognized Supabase infrastructure schema'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'recognized Supabase managed schema'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'PostgreSQL system schema'
      ELSE 'outside public application boundary'
    END AS reason
  FROM pg_catalog.pg_namespace AS n
),
relation_inventory AS (
  SELECT
    c.oid,
    n.nspname AS schema_name,
    c.relname AS object_name,
    c.relkind,
    c.relpersistence,
    pg_catalog.pg_get_userbyid(c.relowner) AS owner,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    CASE c.relkind
      WHEN 'r' THEN 'table'
      WHEN 'p' THEN 'partitioned_table'
      WHEN 'f' THEN 'foreign_table'
      WHEN 'v' THEN 'view'
      WHEN 'm' THEN 'materialized_view'
      ELSE c.relkind::text
    END AS object_type,
    CASE
      WHEN n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM extension_members em
         WHERE em.classid = 'pg_catalog.pg_class'::regclass AND em.objid = c.oid
       ) THEN 'APPLICATION_CANDIDATE'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'POSTGRES_INTERNAL'
      ELSE 'NON_APPLICATION'
    END AS classification
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'f', 'v', 'm')
),
application_tables AS (
  SELECT * FROM relation_inventory
  WHERE object_type IN ('table', 'partitioned_table', 'foreign_table')
    AND classification = 'APPLICATION_CANDIDATE'
),
column_inventory AS (
  SELECT
    a.attrelid AS relation_oid,
    n.nspname AS schema_name,
    c.relname AS table_name,
    a.attnum AS ordinal_position,
    a.attname AS column_name,
    a.atttypid AS type_oid,
    CASE WHEN typ.oid IS NULL THEN NULL ELSE pg_catalog.format_type(a.atttypid, a.atttypmod) END AS formatted_type,
    a.attnotnull AS not_null,
    ad.oid IS NOT NULL AS has_default_metadata,
    CASE WHEN ad.oid IS NULL THEN NULL ELSE pg_catalog.pg_get_expr(ad.adbin, ad.adrelid, true) END AS default_expression,
    CASE WHEN a.attgenerated = 's' THEN pg_catalog.pg_get_expr(ad.adbin, ad.adrelid, true) END AS generated_expression,
    a.attidentity AS identity_generation,
    a.attgenerated AS generated_kind,
    CASE
      WHEN n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM extension_members em
         WHERE em.classid = 'pg_catalog.pg_class'::regclass AND em.objid = c.oid
       ) THEN 'APPLICATION_CANDIDATE'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'POSTGRES_INTERNAL'
      ELSE 'NON_APPLICATION'
    END AS classification
  FROM pg_catalog.pg_attribute AS a
  JOIN pg_catalog.pg_class AS c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  LEFT JOIN pg_catalog.pg_type AS typ ON typ.oid = a.atttypid
  LEFT JOIN pg_catalog.pg_attrdef AS ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
  WHERE a.attnum > 0 AND NOT a.attisdropped
    AND c.relkind IN ('r', 'p', 'f')
),
constraint_inventory AS (
  SELECT
    con.oid,
    n.nspname AS schema_name,
    rel.relname AS table_name,
    con.conname AS constraint_name,
    CASE con.contype
      WHEN 'p' THEN 'PRIMARY KEY'
      WHEN 'u' THEN 'UNIQUE'
      WHEN 'f' THEN 'FOREIGN KEY'
      WHEN 'c' THEN 'CHECK'
      WHEN 'x' THEN 'EXCLUSION'
      ELSE con.contype::text
    END AS constraint_type,
    pg_catalog.pg_get_constraintdef(con.oid, true) AS constraint_definition,
    con.convalidated AS validated,
    con.condeferrable AS is_deferrable,
    con.condeferred AS is_initially_deferred,
    CASE
      WHEN n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM extension_members em
         WHERE em.classid = 'pg_catalog.pg_class'::regclass AND em.objid = rel.oid
       ) THEN 'APPLICATION_CANDIDATE'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'POSTGRES_INTERNAL'
      ELSE 'NON_APPLICATION'
    END AS classification
  FROM pg_catalog.pg_constraint AS con
  JOIN pg_catalog.pg_class AS rel ON rel.oid = con.conrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
  WHERE rel.relkind IN ('r', 'p', 'f')
),
index_inventory AS (
  SELECT
    i.indexrelid AS oid,
    n.nspname AS schema_name,
    tbl.relname AS table_name,
    idx.relname AS index_name,
    pg_catalog.pg_get_indexdef(i.indexrelid) AS index_definition,
    i.indisunique AS is_unique,
    i.indisprimary AS is_primary,
    i.indisexclusion AS is_exclusion,
    i.indisvalid AS is_valid,
    CASE
      WHEN n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM extension_members em
         WHERE em.classid = 'pg_catalog.pg_class'::regclass AND em.objid = tbl.oid
       ) THEN 'APPLICATION_CANDIDATE'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'POSTGRES_INTERNAL'
      ELSE 'NON_APPLICATION'
    END AS classification
  FROM pg_catalog.pg_index AS i
  JOIN pg_catalog.pg_class AS tbl ON tbl.oid = i.indrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = tbl.relnamespace
  JOIN pg_catalog.pg_class AS idx ON idx.oid = i.indexrelid
),
function_inventory AS (
  SELECT
    p.oid,
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    pg_catalog.pg_get_functiondef(p.oid) AS function_definition,
    pg_catalog.pg_get_userbyid(p.proowner) AS owner,
    CASE
      WHEN n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM extension_members em
         WHERE em.classid = 'pg_catalog.pg_proc'::regclass AND em.objid = p.oid
       ) THEN 'APPLICATION_CANDIDATE'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'POSTGRES_INTERNAL'
      ELSE 'NON_APPLICATION'
    END AS classification
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE p.prokind = 'f'
),
view_inventory AS (
  SELECT
    r.oid,
    r.schema_name,
    r.object_name AS view_name,
    pg_catalog.pg_get_viewdef(r.oid, true) AS view_definition,
    r.owner,
    r.classification
  FROM relation_inventory AS r
  WHERE r.object_type = 'view'
),
materialized_view_inventory AS (
  SELECT
    r.oid,
    r.schema_name,
    r.object_name AS view_name,
    pg_catalog.pg_get_viewdef(r.oid, true) AS view_definition,
    r.owner,
    r.classification
  FROM relation_inventory AS r
  WHERE r.object_type = 'materialized_view'
),
trigger_inventory AS (
  SELECT
    t.oid,
    n.nspname AS schema_name,
    rel.relname AS table_name,
    t.tgname AS trigger_name,
    pg_catalog.pg_get_triggerdef(t.oid, true) AS trigger_definition,
    proc_ns.nspname AS function_schema,
    proc.proname AS function_name,
    pg_catalog.pg_get_function_identity_arguments(proc.oid) AS function_identity_arguments,
    CASE
      WHEN n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM extension_members em
         WHERE em.classid = 'pg_catalog.pg_class'::regclass AND em.objid = rel.oid
       ) THEN 'APPLICATION_CANDIDATE'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'POSTGRES_INTERNAL'
      ELSE 'NON_APPLICATION'
    END AS classification
  FROM pg_catalog.pg_trigger AS t
  JOIN pg_catalog.pg_class AS rel ON rel.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
  JOIN pg_catalog.pg_proc AS proc ON proc.oid = t.tgfoid
  JOIN pg_catalog.pg_namespace AS proc_ns ON proc_ns.oid = proc.pronamespace
  WHERE NOT t.tgisinternal
),
policy_inventory AS (
  SELECT
    p.oid,
    n.nspname AS schema_name,
    rel.relname AS table_name,
    p.polname AS policy_name,
    p.polpermissive AS permissive,
    p.polcmd AS command,
    p.polroles AS roles,
    p.polqual IS NOT NULL AS has_using_expression,
    p.polwithcheck IS NOT NULL AS has_with_check_expression,
    pg_catalog.pg_get_expr(p.polqual, rel.oid, true) AS using_expression,
    pg_catalog.pg_get_expr(p.polwithcheck, rel.oid, true) AS with_check_expression,
    CASE
      WHEN n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM extension_members em
         WHERE em.classid = 'pg_catalog.pg_class'::regclass AND em.objid = rel.oid
       ) THEN 'APPLICATION_CANDIDATE'
      WHEN n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN n.nspname IN ('auth', 'storage', 'extensions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog', 'information_schema', 'pg_toast')
        OR n.nspname LIKE 'pg_temp_%'
        OR n.nspname LIKE 'pg_toast_temp_%' THEN 'POSTGRES_INTERNAL'
      ELSE 'NON_APPLICATION'
    END AS classification
  FROM pg_catalog.pg_policy AS p
  JOIN pg_catalog.pg_class AS rel ON rel.oid = p.polrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
),
extension_inventory AS (
  SELECT
    e.oid,
    e.extname AS extension_name,
    e.extversion AS version,
    n.nspname AS schema_name,
    CASE
      WHEN e.extname IN ('pg_graphql', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga')
        OR n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_MANAGED_EXTENSION'
      WHEN e.extname IN ('plpgsql') OR n.nspname = 'pg_catalog' THEN 'POSTGRES_EXTENSION'
      ELSE 'APPLICATION_EXTENSION'
    END AS extension_classification,
    CASE
      WHEN e.extname IN ('pg_graphql', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga')
        OR n.nspname IN ('realtime', 'pg_graphql', 'graphql', 'pgbouncer', 'vault', 'pg_net', 'pgmq', 'pgsodium', 'pgroonga') THEN 'SUPABASE_INTERNAL'
      WHEN e.extname IN ('plpgsql') OR n.nspname = 'pg_catalog' THEN 'POSTGRES_INTERNAL'
      WHEN n.nspname = 'public' THEN 'APPLICATION_CANDIDATE'
      ELSE 'NON_APPLICATION'
    END AS classification
  FROM pg_catalog.pg_extension AS e
  JOIN pg_catalog.pg_namespace AS n ON n.oid = e.extnamespace
),
default_inventory AS (
  SELECT schema_name, table_name, ordinal_position, default_expression, classification
  FROM column_inventory
  WHERE has_default_metadata
),
application_object_registry AS (
  SELECT
    'pg_catalog.pg_class'::regclass AS classid,
    r.oid AS object_oid,
    r.schema_name,
    r.object_name,
    CASE r.object_type
      WHEN 'table' THEN 'TABLE'
      WHEN 'partitioned_table' THEN 'PARTITIONED_TABLE'
      WHEN 'foreign_table' THEN 'FOREIGN_TABLE'
      WHEN 'view' THEN 'VIEW'
      WHEN 'materialized_view' THEN 'MATERIALIZED_VIEW'
      ELSE upper(r.object_type)
    END AS object_type
  FROM relation_inventory AS r
  WHERE r.classification = 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT
    'pg_catalog.pg_class'::regclass,
    c.oid,
    n.nspname,
    c.relname,
    CASE c.relkind WHEN 'i' THEN 'INDEX' WHEN 'S' THEN 'SEQUENCE' ELSE 'RELATION' END
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('i', 'S')
    AND NOT EXISTS (
      SELECT 1 FROM extension_members em
      WHERE em.classid = 'pg_catalog.pg_class'::regclass AND em.objid = c.oid
    )
  UNION ALL
  SELECT
    'pg_catalog.pg_proc'::regclass,
    f.oid,
    f.schema_name,
    f.function_name || '(' || f.identity_arguments || ')',
    'FUNCTION'
  FROM function_inventory AS f
  WHERE f.classification = 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT
    'pg_catalog.pg_type'::regclass,
    t.oid,
    n.nspname,
    t.typname,
    CASE t.typtype WHEN 'd' THEN 'DOMAIN' WHEN 'e' THEN 'ENUM' WHEN 'c' THEN 'COMPOSITE_TYPE' ELSE 'TYPE' END
  FROM pg_catalog.pg_type AS t
  JOIN pg_catalog.pg_namespace AS n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typtype IN ('d', 'e', 'c')
    AND NOT EXISTS (
      SELECT 1 FROM extension_members em
      WHERE em.classid = 'pg_catalog.pg_type'::regclass AND em.objid = t.oid
    )
  UNION ALL
  SELECT
    'pg_catalog.pg_constraint'::regclass,
    c.oid,
    c.schema_name,
    c.table_name || '.' || c.constraint_name,
    'CONSTRAINT'
  FROM constraint_inventory AS c
  WHERE c.classification = 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT
    'pg_catalog.pg_attrdef'::regclass,
    ad.oid,
    n.nspname,
    rel.relname || '.' || a.attname,
    'DEFAULT'
  FROM pg_catalog.pg_attrdef AS ad
  JOIN pg_catalog.pg_class AS rel ON rel.oid = ad.adrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
  JOIN pg_catalog.pg_attribute AS a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
  WHERE n.nspname = 'public'
    AND rel.relkind IN ('r', 'p', 'f')
    AND NOT a.attisdropped
),
catalog_object_registry AS (
  SELECT DISTINCT classid, object_oid, schema_name, object_name, object_type
  FROM (
    SELECT classid, object_oid, schema_name, object_name, object_type
    FROM application_object_registry
    UNION ALL
  SELECT
    'pg_catalog.pg_class'::regclass,
    c.oid,
    n.nspname,
    c.relname,
    CASE c.relkind
      WHEN 'r' THEN 'TABLE'
      WHEN 'p' THEN 'PARTITIONED_TABLE'
      WHEN 'f' THEN 'FOREIGN_TABLE'
      WHEN 'v' THEN 'VIEW'
      WHEN 'm' THEN 'MATERIALIZED_VIEW'
      WHEN 'i' THEN 'INDEX'
      WHEN 'S' THEN 'SEQUENCE'
      ELSE 'RELATION'
    END
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'f', 'v', 'm', 'i', 'S')
  UNION ALL
  SELECT
    'pg_catalog.pg_proc'::regclass,
    p.oid,
    n.nspname,
    p.proname || '(' || pg_catalog.pg_get_function_identity_arguments(p.oid) || ')',
    CASE p.prokind WHEN 'p' THEN 'PROCEDURE' ELSE 'FUNCTION' END
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  UNION ALL
  SELECT 'pg_catalog.pg_type'::regclass, t.oid, n.nspname, t.typname,
    CASE t.typtype WHEN 'd' THEN 'DOMAIN' WHEN 'e' THEN 'ENUM' WHEN 'c' THEN 'COMPOSITE_TYPE' ELSE 'TYPE' END
  FROM pg_catalog.pg_type AS t
  JOIN pg_catalog.pg_namespace AS n ON n.oid = t.typnamespace
  UNION ALL
  SELECT 'pg_catalog.pg_namespace'::regclass, n.oid, n.nspname, n.nspname, 'SCHEMA'
  FROM pg_catalog.pg_namespace AS n
  UNION ALL
  SELECT 'pg_catalog.pg_constraint'::regclass, c.oid, n.nspname, rel.relname || '.' || c.conname, 'CONSTRAINT'
  FROM pg_catalog.pg_constraint AS c
  JOIN pg_catalog.pg_class AS rel ON rel.oid = c.conrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
  UNION ALL
  SELECT 'pg_catalog.pg_attrdef'::regclass, ad.oid, n.nspname, rel.relname || '.' || a.attname, 'DEFAULT'
  FROM pg_catalog.pg_attrdef AS ad
  JOIN pg_catalog.pg_class AS rel ON rel.oid = ad.adrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
  JOIN pg_catalog.pg_attribute AS a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
  WHERE NOT a.attisdropped
  ) AS registry_rows
),
dependency_inventory AS (
  SELECT
    d.objid AS dependent_oid,
    d.refobjid AS referenced_oid,
    d.deptype,
    dep.schema_name AS dependent_schema,
    dep.object_name AS dependent_object,
    dep.object_type AS dependent_object_type,
    dep_col.attname AS dependent_column,
    ref.schema_name AS referenced_schema,
    ref.object_name AS referenced_object,
    ref.object_type AS referenced_object_type,
    ref_col.attname AS referenced_column,
    CASE
      WHEN app_dep.object_oid IS NOT NULL AND app_ref.object_oid IS NOT NULL THEN 'APPLICATION'
      WHEN app_dep.object_oid IS NOT NULL THEN 'EXTERNAL_MANAGED'
      WHEN app_ref.object_oid IS NOT NULL THEN 'QUARANTINED'
      ELSE 'OUT_OF_SCOPE'
    END AS dependency_scope
  FROM pg_catalog.pg_depend AS d
  LEFT JOIN catalog_object_registry AS dep
    ON dep.classid = d.classid AND dep.object_oid = d.objid
  LEFT JOIN catalog_object_registry AS ref
    ON ref.classid = d.refclassid AND ref.object_oid = d.refobjid
  LEFT JOIN application_object_registry AS app_dep
    ON app_dep.classid = d.classid AND app_dep.object_oid = d.objid
  LEFT JOIN application_object_registry AS app_ref
    ON app_ref.classid = d.refclassid AND app_ref.object_oid = d.refobjid
  LEFT JOIN pg_catalog.pg_attribute AS dep_col
    ON d.classid = 'pg_catalog.pg_class'::regclass AND dep_col.attrelid = d.objid AND dep_col.attnum = d.objsubid AND NOT dep_col.attisdropped
  LEFT JOIN pg_catalog.pg_attribute AS ref_col
    ON d.refclassid = 'pg_catalog.pg_class'::regclass AND ref_col.attrelid = d.refobjid AND ref_col.attnum = d.refobjsubid AND NOT ref_col.attisdropped
  WHERE app_dep.object_oid IS NOT NULL OR app_ref.object_oid IS NOT NULL
),
dependency_errors AS (
  SELECT 'DEPENDENCY_IDENTITY_UNRESOLVED: application dependency could not be resolved to canonical identity' AS reason
  WHERE EXISTS (
    SELECT 1 FROM dependency_inventory
    WHERE dependency_scope IN ('APPLICATION', 'EXTERNAL_MANAGED', 'QUARANTINED')
      AND (dependent_schema IS NULL OR dependent_object IS NULL OR dependent_object_type IS NULL
        OR (dependency_scope = 'APPLICATION' AND (referenced_schema IS NULL OR referenced_object IS NULL OR referenced_object_type IS NULL)))
  )
  UNION ALL
  SELECT 'DEPENDENCY_CYCLE_DETECTION_NOT_IMPLEMENTED: topological ordering is not certified'
  WHERE EXISTS (SELECT 1 FROM application_object_registry)
),
validation_errors AS (
  SELECT 'No application tables found' AS reason
  WHERE NOT EXISTS (SELECT 1 FROM application_tables)
  UNION ALL
  SELECT 'Missing table metadata: ' || schema_name || '.' || object_name
  FROM application_tables
  WHERE object_name IS NULL OR owner IS NULL OR relkind IS NULL OR relpersistence IS NULL
  UNION ALL
  SELECT 'Missing column name: ' || schema_name || '.' || table_name || '.' || ordinal_position
  FROM column_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND column_name IS NULL
  UNION ALL
  SELECT 'Missing column type: ' || schema_name || '.' || table_name || '.' || COALESCE(column_name, ordinal_position::text)
  FROM column_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND formatted_type IS NULL
  UNION ALL
  SELECT 'Missing default metadata: ' || schema_name || '.' || table_name || '.' || column_name
  FROM column_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND has_default_metadata AND default_expression IS NULL
  UNION ALL
  SELECT 'Missing constraint definition: ' || schema_name || '.' || table_name || '.' || constraint_name
  FROM constraint_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND constraint_definition IS NULL
  UNION ALL
  SELECT 'Missing FK definition: ' || schema_name || '.' || table_name || '.' || constraint_name
  FROM constraint_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND constraint_type = 'FOREIGN KEY' AND constraint_definition IS NULL
  UNION ALL
  SELECT 'Missing index definition: ' || schema_name || '.' || index_name
  FROM index_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND index_definition IS NULL
  UNION ALL
  SELECT 'Missing function signature: ' || schema_name || '.' || function_name
  FROM function_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND identity_arguments IS NULL
  UNION ALL
  SELECT 'Missing function body: ' || schema_name || '.' || function_name || '(' || COALESCE(identity_arguments, '') || ')'
  FROM function_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND function_definition IS NULL
  UNION ALL
  SELECT 'Missing view definition: ' || schema_name || '.' || view_name
  FROM view_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND view_definition IS NULL
  UNION ALL
  SELECT 'Missing materialized view definition: ' || schema_name || '.' || view_name
  FROM materialized_view_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND view_definition IS NULL
  UNION ALL
  SELECT 'Missing trigger definition: ' || schema_name || '.' || table_name || '.' || trigger_name
  FROM trigger_inventory
  WHERE classification = 'APPLICATION_CANDIDATE' AND trigger_definition IS NULL
  UNION ALL
  SELECT 'Missing RLS policy definition: ' || schema_name || '.' || table_name || '.' || policy_name
  FROM policy_inventory
  WHERE classification = 'APPLICATION_CANDIDATE'
    AND ((has_using_expression AND using_expression IS NULL)
      OR (has_with_check_expression AND with_check_expression IS NULL))
  UNION ALL
  SELECT reason FROM dependency_errors
),
quarantine AS (
  SELECT classification, 'schema' AS object_type, schema_name, schema_name AS object_name, reason
  FROM schema_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT classification, object_type, schema_name, object_name,
    CASE classification
      WHEN 'SUPABASE_INTERNAL' THEN 'recognized Supabase infrastructure object'
      WHEN 'SUPABASE_MANAGED' THEN 'recognized Supabase managed object'
      WHEN 'POSTGRES_INTERNAL' THEN 'PostgreSQL internal object'
      ELSE 'outside public application boundary or extension-owned'
    END
  FROM relation_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT classification, 'column', schema_name, table_name || '.' || COALESCE(column_name, ordinal_position::text),
    'column belongs to a quarantined relation'
  FROM column_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT classification, 'constraint', schema_name, table_name || '.' || constraint_name, 'constraint belongs to a quarantined relation'
  FROM constraint_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT classification, 'index', schema_name, index_name, 'index belongs to a quarantined relation'
  FROM index_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT classification, 'function', schema_name, function_name || '(' || COALESCE(identity_arguments, '') || ')', 'function is outside the application boundary'
  FROM function_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT classification, 'trigger', schema_name, table_name || '.' || trigger_name, 'trigger belongs to a quarantined relation'
  FROM trigger_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT classification, 'policy', schema_name, table_name || '.' || policy_name, 'policy belongs to a quarantined relation'
  FROM policy_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT classification, 'extension', schema_name, extension_name, extension_classification
  FROM extension_inventory
  WHERE classification <> 'APPLICATION_CANDIDATE'
  UNION ALL
  SELECT
    CASE dependency_scope WHEN 'EXTERNAL_MANAGED' THEN 'SUPABASE_MANAGED' ELSE 'NON_APPLICATION' END,
    'dependency',
    COALESCE(dependent_schema, '<unresolved>'),
    COALESCE(dependent_object, '<unresolved>') || ' -> ' || COALESCE(referenced_schema, '<unresolved>') || '.' || COALESCE(referenced_object, '<unresolved>'),
    dependency_scope || ' dependency retained for audit'
  FROM dependency_inventory
  WHERE dependency_scope <> 'APPLICATION'
),
dependency_summary AS (
  SELECT
    count(*) FILTER (WHERE dependency_scope IN ('APPLICATION', 'EXTERNAL_MANAGED', 'QUARANTINED')) AS total_dependencies,
    count(*) FILTER (WHERE dependency_scope = 'APPLICATION') AS application_dependencies,
    count(*) FILTER (WHERE dependency_scope = 'EXTERNAL_MANAGED') AS external_managed_dependencies,
    count(*) FILTER (WHERE dependency_scope = 'QUARANTINED') AS quarantined_dependencies,
    count(*) FILTER (
      WHERE dependency_scope IN ('APPLICATION', 'EXTERNAL_MANAGED', 'QUARANTINED')
        AND (dependent_schema IS NULL OR dependent_object IS NULL OR dependent_object_type IS NULL
          OR referenced_schema IS NULL OR referenced_object IS NULL OR referenced_object_type IS NULL)
    ) AS unresolved_dependencies
  FROM dependency_inventory
),
dependency_resolution AS (
  SELECT jsonb_build_object(
    'status', CASE WHEN s.unresolved_dependencies = 0 AND NOT EXISTS (SELECT 1 FROM dependency_errors) THEN 'PASS' ELSE 'BLOCKED' END,
    'nodes', (SELECT count(*) FROM application_object_registry),
    'edges', s.total_dependencies,
    'unresolved_edges', s.unresolved_dependencies,
    'canonical_identities_complete', s.unresolved_dependencies = 0,
    'topological_order_ready', s.unresolved_dependencies = 0 AND NOT EXISTS (SELECT 1 FROM dependency_errors)
  ) AS value
  FROM dependency_summary AS s
),
cycle_detection AS (
  SELECT jsonb_build_object(
    'status', 'NOT_IMPLEMENTED',
    'cycles_detected', NULL,
    'baseline_ordering_safe', false
  ) AS value
),
error_result AS (
  SELECT COALESCE(jsonb_agg(reason ORDER BY reason), '[]'::jsonb) AS errors
  FROM validation_errors
),
application_objects AS (
  SELECT jsonb_build_object(
    'schemas', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema_name', schema_name, 'owner', owner, 'classification', classification) ORDER BY schema_name) FROM schema_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'tables', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'table_name', object_name, 'owner', owner, 'relkind', relkind, 'persistence', relpersistence, 'rls_enabled', rls_enabled, 'rls_forced', rls_forced) ORDER BY schema_name, object_name) FROM application_tables), '[]'::jsonb),
    'columns', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'table', table_name, 'ordinal_position', ordinal_position, 'column_name', column_name, 'data_type', formatted_type, 'formatted_type', formatted_type, 'not_null', not_null, 'default_expression', default_expression) ORDER BY schema_name, table_name, ordinal_position) FROM column_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'defaults', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'table', table_name, 'ordinal_position', ordinal_position, 'default_expression', default_expression) ORDER BY schema_name, table_name, ordinal_position) FROM default_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'constraints', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'table', table_name, 'constraint_name', constraint_name, 'constraint_type', constraint_type, 'constraint_definition', constraint_definition, 'validated', validated, 'deferrable', is_deferrable, 'initially_deferred', is_initially_deferred) ORDER BY schema_name, table_name, constraint_name) FROM constraint_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'indexes', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'table', table_name, 'index_name', index_name, 'index_definition', index_definition, 'unique', is_unique, 'primary', is_primary, 'exclusion', is_exclusion, 'valid', is_valid) ORDER BY schema_name, index_name) FROM index_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'functions', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'function_name', function_name, 'identity_arguments', identity_arguments, 'return_type', return_type, 'function_definition', function_definition) ORDER BY schema_name, function_name, identity_arguments) FROM function_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'views', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'view_name', view_name, 'view_definition', view_definition) ORDER BY schema_name, view_name) FROM view_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'materialized_views', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'view_name', view_name, 'view_definition', view_definition) ORDER BY schema_name, view_name) FROM materialized_view_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'triggers', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'table', table_name, 'trigger_name', trigger_name, 'trigger_definition', trigger_definition, 'function_schema', function_schema, 'function_name', function_name, 'function_identity_arguments', function_identity_arguments) ORDER BY schema_name, table_name, trigger_name) FROM trigger_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'policies', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schema_name, 'table', table_name, 'policy_name', policy_name, 'permissive', permissive, 'command', command, 'roles', roles, 'using_expression', using_expression, 'with_check_expression', with_check_expression) ORDER BY schema_name, table_name, policy_name) FROM policy_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'extensions', COALESCE((SELECT jsonb_agg(jsonb_build_object('extension_name', extension_name, 'version', version, 'schema', schema_name, 'extension_classification', extension_classification) ORDER BY schema_name, extension_name) FROM extension_inventory WHERE classification = 'APPLICATION_CANDIDATE'), '[]'::jsonb),
    'dependencies', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'dependent_key', dependent_schema || '.' || dependent_object || '::' || dependent_object_type || COALESCE('#' || dependent_column, ''),
      'dependent_oid', dependent_oid,
      'dependent_schema', dependent_schema,
      'dependent_object', dependent_object,
      'dependent_object_type', dependent_object_type,
      'dependent_column', dependent_column,
      'referenced_key', referenced_schema || '.' || referenced_object || '::' || referenced_object_type || COALESCE('#' || referenced_column, ''),
      'referenced_oid', referenced_oid,
      'referenced_schema', referenced_schema,
      'referenced_object', referenced_object,
      'referenced_object_type', referenced_object_type,
      'referenced_column', referenced_column,
      'dependency_type_code', deptype,
      'dependency_scope', dependency_scope
    ) ORDER BY dependent_schema, dependent_object_type, dependent_object, dependent_column, referenced_schema, referenced_object_type, referenced_object, referenced_column, deptype) FROM dependency_inventory WHERE dependency_scope = 'APPLICATION'), '[]'::jsonb)
  ) AS value
),
quarantine_result AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('classification', classification, 'object_type', object_type, 'schema', schema_name, 'object_name', object_name, 'reason', reason) ORDER BY schema_name, object_type, object_name, classification), '[]'::jsonb) AS value
  FROM quarantine
)
SELECT jsonb_build_object(
  'validator', 'PRODUCTION-CATALOG-NORMALIZATION',
  'version', '2.1.0',
  'execution_mode', 'READ_ONLY',
  'status', CASE WHEN jsonb_array_length(error_result.errors) = 0 THEN 'PASS' ELSE 'BLOCKED' END,
  'decision', CASE WHEN jsonb_array_length(error_result.errors) = 0 THEN 'READY_FOR_CANONICAL_BASELINE' ELSE 'DO_NOT_PROCEED' END,
  'application_summary', jsonb_build_object(
    'schema_boundary', 'public',
    'table_count', (SELECT count(*) FROM application_tables),
    'column_count', (SELECT count(*) FROM column_inventory WHERE classification = 'APPLICATION_CANDIDATE'),
    'function_count', (SELECT count(*) FROM function_inventory WHERE classification = 'APPLICATION_CANDIDATE'),
    'view_count', (SELECT count(*) FROM view_inventory WHERE classification = 'APPLICATION_CANDIDATE'),
    'materialized_view_count', (SELECT count(*) FROM materialized_view_inventory WHERE classification = 'APPLICATION_CANDIDATE'),
    'quarantine_count', (SELECT count(*) FROM quarantine)
  ),
  'dependency_summary', jsonb_build_object(
    'total_dependencies', (SELECT total_dependencies FROM dependency_summary),
    'application_dependencies', (SELECT application_dependencies FROM dependency_summary),
    'external_managed_dependencies', (SELECT external_managed_dependencies FROM dependency_summary),
    'quarantined_dependencies', (SELECT quarantined_dependencies FROM dependency_summary),
    'unresolved_dependencies', (SELECT unresolved_dependencies FROM dependency_summary)
  ),
  'dependency_resolution', dependency_resolution.value,
  'cycle_detection', cycle_detection.value,
  'validation_errors', error_result.errors,
  'quarantine', quarantine_result.value,
  'application_objects', application_objects.value
)
FROM error_result
CROSS JOIN quarantine_result
CROSS JOIN application_objects
CROSS JOIN dependency_resolution
CROSS JOIN cycle_detection;