-- PRODUCTION-CATALOG-DEPENDENCY-RESOLUTION v2.2.0
-- Purpose: resolve pg_depend evidence to reproducible PostgreSQL object identities.
-- Scope: read-only production catalog analysis; no baseline, migration, or DDL is generated.
-- Read-only guarantee: one SELECT over pg_catalog; it changes no settings or database objects.
-- Input assumptions: run in an authorized read-only session against the catalog being assessed.
-- Canonical identity rules: relation=schema.name; routine=schema.name(identity_arguments);
--   constraint/trigger/index=schema.table.name; extension=extension:name. OIDs are evidence only.
-- Boundary classification: non-extension public objects are APPLICATION; Supabase, extension,
--   PostgreSQL, and other-schema objects remain resolved but out of application scope.
-- Resolution rules: classid/refclassid + objid use authoritative catalogs. pg_rewrite and pg_attrdef
--   resolve to their owning relation, avoiding implementation OIDs as identities.
-- Validation rules: application-attached edges need two canonical endpoints; routine signatures are required.
-- Gate criteria: PASS needs application edges, complete resolution, no OID identities, ambiguity, boundary
--   violations, or inter-object application cycles. Ordering is never emitted by this artifact.

WITH RECURSIVE
extension_members AS (
  SELECT classid, objid FROM pg_catalog.pg_depend
  WHERE deptype = 'e' AND refclassid = 'pg_catalog.pg_extension'::regclass
),
schema_boundary AS (
  SELECT n.oid, n.nspname,
    CASE WHEN n.nspname = 'public' THEN 'APPLICATION'
      WHEN n.nspname IN ('auth','storage','extensions','realtime','pg_graphql','graphql','pgbouncer','vault','pg_net','pgmq','pgsodium','pgroonga','supabase_functions') THEN 'SUPABASE_MANAGED'
      WHEN n.nspname IN ('pg_catalog','information_schema','pg_toast') OR n.nspname LIKE 'pg_temp_%' OR n.nspname LIKE 'pg_toast_temp_%' THEN 'SYSTEM'
      ELSE 'NON_APPLICATION' END AS boundary_classification
  FROM pg_catalog.pg_namespace n
),
relations AS (
  SELECT 'pg_catalog.pg_class'::regclass classid, c.oid object_oid, n.nspname object_schema,CASE WHEN c.relkind='i' THEN owner_rel.relname||'.'||c.relname ELSE c.relname END object_name,
    CASE c.relkind WHEN 'r' THEN 'TABLE' WHEN 'p' THEN 'PARTITIONED_TABLE' WHEN 'f' THEN 'FOREIGN_TABLE' WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED_VIEW' WHEN 'i' THEN 'INDEX' WHEN 'S' THEN 'SEQUENCE' ELSE 'RELATION' END object_type,
    CASE WHEN em.objid IS NOT NULL THEN 'EXTENSION_MANAGED' WHEN sb.boundary_classification = 'APPLICATION' THEN 'APPLICATION' ELSE sb.boundary_classification END boundary_classification
  FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace JOIN schema_boundary sb ON sb.oid=c.relnamespace LEFT JOIN pg_catalog.pg_index ix ON ix.indexrelid=c.oid LEFT JOIN pg_catalog.pg_class owner_rel ON owner_rel.oid=ix.indrelid
  LEFT JOIN extension_members em ON em.classid='pg_catalog.pg_class'::regclass AND em.objid=c.oid
  WHERE c.relkind IN ('r','p','f','v','m','i','S')
),
registry AS (
  SELECT * FROM relations
  UNION ALL SELECT 'pg_catalog.pg_proc'::regclass,p.oid,n.nspname,p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')',CASE p.prokind WHEN 'p' THEN 'PROCEDURE' ELSE 'FUNCTION' END,
    CASE WHEN em.objid IS NOT NULL THEN 'EXTENSION_MANAGED' WHEN sb.boundary_classification='APPLICATION' THEN 'APPLICATION' ELSE sb.boundary_classification END
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN schema_boundary sb ON sb.oid=p.pronamespace LEFT JOIN extension_members em ON em.classid='pg_catalog.pg_proc'::regclass AND em.objid=p.oid WHERE p.prokind IN ('f','p')
  UNION ALL SELECT 'pg_catalog.pg_type'::regclass,t.oid,n.nspname,t.typname,CASE t.typtype WHEN 'd' THEN 'DOMAIN' WHEN 'e' THEN 'ENUM' WHEN 'c' THEN 'COMPOSITE_TYPE' ELSE 'TYPE' END,
    CASE WHEN em.objid IS NOT NULL THEN 'EXTENSION_MANAGED' WHEN sb.boundary_classification='APPLICATION' THEN 'APPLICATION' ELSE sb.boundary_classification END
  FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace JOIN schema_boundary sb ON sb.oid=t.typnamespace LEFT JOIN extension_members em ON em.classid='pg_catalog.pg_type'::regclass AND em.objid=t.oid WHERE t.typtype IN ('b','c','d','e','r')
  UNION ALL SELECT 'pg_catalog.pg_constraint'::regclass,c.oid,r.object_schema,r.object_name||'.'||c.conname,'CONSTRAINT',r.boundary_classification FROM pg_catalog.pg_constraint c JOIN relations r ON r.object_oid=c.conrelid
  UNION ALL SELECT 'pg_catalog.pg_trigger'::regclass,t.oid,r.object_schema,r.object_name||'.'||t.tgname,'TRIGGER',r.boundary_classification FROM pg_catalog.pg_trigger t JOIN relations r ON r.object_oid=t.tgrelid
  UNION ALL SELECT 'pg_catalog.pg_rewrite'::regclass,w.oid,r.object_schema,r.object_name,CASE WHEN r.object_type='VIEW' THEN 'VIEW' WHEN r.object_type='MATERIALIZED_VIEW' THEN 'MATERIALIZED_VIEW' ELSE 'REWRITE_RULE' END,r.boundary_classification FROM pg_catalog.pg_rewrite w JOIN relations r ON r.object_oid=w.ev_class
  UNION ALL SELECT 'pg_catalog.pg_attrdef'::regclass,a.oid,r.object_schema,r.object_name,r.object_type,r.boundary_classification FROM pg_catalog.pg_attrdef a JOIN relations r ON r.object_oid=a.adrelid
  UNION ALL SELECT 'pg_catalog.pg_extension'::regclass,e.oid,n.nspname,'extension:'||e.extname,'EXTENSION','EXTENSION_MANAGED' FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace
),
raw_edges AS (
  SELECT d.objid dependent_oid,d.refobjid referenced_oid,d.deptype dependency_subtype,CASE d.deptype WHEN 'n' THEN 'NORMAL' WHEN 'a' THEN 'AUTO' WHEN 'i' THEN 'INTERNAL' WHEN 'e' THEN 'EXTENSION' WHEN 'p' THEN 'PIN' ELSE 'OTHER' END dependency_type,
    dep.object_schema dependent_schema,dep.object_name dependent_object,dep.object_type dependent_object_type,dep.boundary_classification dependent_boundary,
    ref.object_schema referenced_schema,ref.object_name referenced_object,ref.object_type referenced_object_type,ref.boundary_classification referenced_boundary
  FROM pg_catalog.pg_depend d LEFT JOIN registry dep ON dep.classid=d.classid AND dep.object_oid=d.objid LEFT JOIN registry ref ON ref.classid=d.refclassid AND ref.object_oid=d.refobjid
),
classified AS (
  SELECT r.*,CASE WHEN dependent_boundary='APPLICATION' AND referenced_boundary='APPLICATION' THEN 'APPLICATION' WHEN dependent_boundary='APPLICATION' AND referenced_boundary IS NULL THEN 'APPLICATION' WHEN dependent_boundary IS NULL AND referenced_boundary='APPLICATION' THEN 'APPLICATION' WHEN dependent_boundary='APPLICATION' THEN 'OUT_OF_SCOPE' WHEN referenced_boundary='APPLICATION' THEN 'QUARANTINED' WHEN dependent_boundary='SUPABASE_MANAGED' OR referenced_boundary='SUPABASE_MANAGED' THEN 'SUPABASE_MANAGED' WHEN dependent_boundary='EXTENSION_MANAGED' OR referenced_boundary='EXTENSION_MANAGED' THEN 'EXTENSION_MANAGED' WHEN dependent_boundary='SYSTEM' OR referenced_boundary='SYSTEM' THEN 'SYSTEM' WHEN dependent_boundary IS NULL OR referenced_boundary IS NULL THEN 'UNRESOLVED' ELSE 'NON_APPLICATION' END boundary_classification,
    CASE WHEN dependent_schema IS NOT NULL AND dependent_object IS NOT NULL AND dependent_object_type IS NOT NULL THEN CASE WHEN dependent_object_type='EXTENSION' THEN dependent_object ELSE dependent_schema||'.'||dependent_object END END dependent_identity,
    CASE WHEN referenced_schema IS NOT NULL AND referenced_object IS NOT NULL AND referenced_object_type IS NOT NULL THEN CASE WHEN referenced_object_type='EXTENSION' THEN referenced_object ELSE referenced_schema||'.'||referenced_object END END referenced_identity
  FROM raw_edges r WHERE dependent_boundary='APPLICATION' OR referenced_boundary='APPLICATION'
),
edges AS (
  SELECT DISTINCT ON (dependent_identity,referenced_identity,dependency_type,dependency_subtype) *,
    CASE WHEN dependent_schema IS NULL OR dependent_object IS NULL OR dependent_object_type IS NULL OR referenced_schema IS NULL OR referenced_object IS NULL OR referenced_object_type IS NULL OR dependent_identity IS NULL OR referenced_identity IS NULL THEN 'UNRESOLVED' WHEN boundary_classification='APPLICATION' THEN 'RESOLVED_APPLICATION' ELSE 'RESOLVED_OUT_OF_SCOPE' END resolution_status,
    CASE WHEN dependent_schema IS NULL OR referenced_schema IS NULL THEN 'catalog class/object resolver returned no schema' WHEN dependent_object IS NULL OR referenced_object IS NULL THEN 'catalog class/object resolver returned no object' WHEN dependent_object_type IS NULL OR referenced_object_type IS NULL THEN 'catalog class/object resolver returned no object type' WHEN boundary_classification='APPLICATION' THEN 'resolved from authoritative catalog identity' ELSE 'resolved from authoritative catalog identity; outside application baseline boundary' END resolution_reason
  FROM classified ORDER BY dependent_identity,referenced_identity,dependency_type,dependency_subtype
),
graph AS (SELECT DISTINCT dependent_identity,referenced_identity FROM edges WHERE boundary_classification='APPLICATION' AND resolution_status='RESOLVED_APPLICATION' AND dependent_identity<>referenced_identity),
paths AS (
  SELECT dependent_identity cycle_start,referenced_identity current_identity,ARRAY[dependent_identity,referenced_identity]::text[] visited,1 depth FROM graph
  UNION ALL SELECT p.cycle_start,g.referenced_identity,p.visited||g.referenced_identity,p.depth+1 FROM paths p JOIN graph g ON g.dependent_identity=p.current_identity WHERE p.depth<100 AND (g.referenced_identity=p.cycle_start OR NOT g.referenced_identity=ANY(p.visited))
),
cycles AS (SELECT DISTINCT array_to_string(visited,' -> ') cycle_path FROM paths WHERE current_identity=cycle_start AND depth>1),
ambiguous_routines AS (SELECT object_schema,split_part(object_name,'(',1) FROM registry WHERE boundary_classification='APPLICATION' AND object_type IN ('FUNCTION','PROCEDURE') GROUP BY object_schema,split_part(object_name,'(',1) HAVING bool_or(object_name !~ '\\([^)]*\\)$')),
validation AS (
  SELECT count(*) FILTER(WHERE boundary_classification='APPLICATION') application_dependency_count,count(*) FILTER(WHERE boundary_classification='APPLICATION' AND resolution_status='RESOLVED_APPLICATION') resolved_application_dependency_count,count(*) FILTER(WHERE boundary_classification='APPLICATION' AND resolution_status='UNRESOLVED') unresolved_application_dependency_count,count(*) FILTER(WHERE boundary_classification<>'APPLICATION') out_of_scope_dependency_count,
    count(*) FILTER(WHERE boundary_classification='APPLICATION' AND (dependent_identity IS NULL OR referenced_identity IS NULL OR dependent_identity ~ '^[0-9]+$' OR referenced_identity ~ '^[0-9]+$' OR lower(dependent_identity) LIKE '%<unresolved>%' OR lower(referenced_identity) LIKE '%<unresolved>%' OR lower(dependent_identity) LIKE '%<unknown>%' OR lower(referenced_identity) LIKE '%<unknown>%')) oid_canonical_identity_count,
    (SELECT count(*) FROM ambiguous_routines) ambiguous_function_count,(SELECT count(*) FROM cycles) cycle_count,count(*) FILTER(WHERE boundary_classification='APPLICATION' AND (dependent_boundary<>'APPLICATION' OR referenced_boundary<>'APPLICATION')) invalid_application_boundary_count FROM edges
),
errors AS (
  SELECT 'APPLICATION_DEPENDENCY_UNRESOLVED' code,'Application dependency has no complete canonical endpoint identity.' message FROM validation WHERE unresolved_application_dependency_count>0 UNION ALL SELECT 'CANONICAL_IDENTITY_OID_OR_MARKER','Application canonical identity contains an OID, unknown, or unresolved marker.' FROM validation WHERE oid_canonical_identity_count>0 UNION ALL SELECT 'AMBIGUOUS_FUNCTION_SIGNATURE','An application routine cannot be distinguished by a canonical signature.' FROM validation WHERE ambiguous_function_count>0 UNION ALL SELECT 'DEPENDENCY_CYCLE_DETECTED','An inter-object application dependency cycle prevents deterministic ordering.' FROM validation WHERE cycle_count>0 UNION ALL SELECT 'APPLICATION_BOUNDARY_VIOLATION','An application edge has an endpoint outside the application boundary.' FROM validation WHERE invalid_application_boundary_count>0 UNION ALL SELECT 'NO_APPLICATION_DEPENDENCIES','No application dependency edge was found; ordering readiness cannot be established.' FROM validation WHERE application_dependency_count=0
),
top_failing_objects AS (
  SELECT COALESCE(dependent_identity,'<unresolved>')||' -> '||COALESCE(referenced_identity,'<unresolved>') item FROM edges WHERE boundary_classification='APPLICATION' AND resolution_status='UNRESOLVED'
  UNION SELECT cycle_path FROM cycles
)
SELECT jsonb_build_object(
  'validator','PRODUCTION-CATALOG-DEPENDENCY-RESOLUTION','version','v2.2.0','execution_mode','READ_ONLY','gate_status',CASE WHEN EXISTS(SELECT 1 FROM errors) THEN 'BLOCKED' ELSE 'PASS' END,'pipeline_stage','DEPENDENCY_RESOLUTION','generated_at',pg_catalog.statement_timestamp(),
  'application_dependency_count',v.application_dependency_count,'resolved_application_dependency_count',v.resolved_application_dependency_count,'unresolved_application_dependency_count',v.unresolved_application_dependency_count,'out_of_scope_dependency_count',v.out_of_scope_dependency_count,'ambiguous_function_count',v.ambiguous_function_count,'cycle_count',v.cycle_count,'oid_canonical_identity_count',v.oid_canonical_identity_count,'duplicate_edge_count',(SELECT count(*) FROM classified)-(SELECT count(*) FROM edges),'invalid_application_boundary_count',v.invalid_application_boundary_count,
  'all_application_dependencies_resolved',CASE WHEN v.unresolved_application_dependency_count=0 THEN 'YES' ELSE 'BLOCKED' END,'deterministic_ordering',CASE WHEN NOT EXISTS(SELECT 1 FROM errors) THEN 'READY' ELSE 'BLOCKED' END,'baseline_readiness',CASE WHEN NOT EXISTS(SELECT 1 FROM errors) THEN 'READY_FOR_CANONICAL_BASELINE_ORDERING' ELSE 'BLOCKED_DO_NOT_GENERATE_CANONICAL_RUNTIME_BASELINE' END,
  'validation',jsonb_build_object('application_dependencies_resolved',CASE WHEN v.unresolved_application_dependency_count=0 THEN 'YES' ELSE 'BLOCKED' END,'oid_based_canonical_identities',v.oid_canonical_identity_count,'unresolved_application_dependencies',v.unresolved_application_dependency_count,'ambiguous_function_signatures',v.ambiguous_function_count,'dependency_cycles',v.cycle_count,'supabase_system_incorrectly_application',v.invalid_application_boundary_count),
  'dependencies',COALESCE((SELECT jsonb_agg(jsonb_build_object('dependent_oid',dependent_oid,'dependent_schema',dependent_schema,'dependent_object',dependent_object,'dependent_object_type',dependent_object_type,'dependent_identity',dependent_identity,'referenced_oid',referenced_oid,'referenced_schema',referenced_schema,'referenced_object',referenced_object,'referenced_object_type',referenced_object_type,'referenced_identity',referenced_identity,'dependency_type',dependency_type,'dependency_subtype',dependency_subtype,'boundary_classification',boundary_classification,'resolution_status',resolution_status,'resolution_reason',resolution_reason) ORDER BY dependent_identity NULLS LAST,referenced_identity NULLS LAST,dependency_type,dependency_subtype) FROM edges),'[]'::jsonb),
  'validation_errors',COALESCE((SELECT jsonb_agg(jsonb_build_object('code',code,'severity','BLOCKING','message',message) ORDER BY code) FROM errors),'[]'::jsonb),'cycles',COALESCE((SELECT jsonb_agg(cycle_path ORDER BY cycle_path) FROM cycles),'[]'::jsonb),'top_failing_objects',COALESCE((SELECT jsonb_agg(item ORDER BY item) FROM top_failing_objects),'[]'::jsonb)
) FROM validation v;
