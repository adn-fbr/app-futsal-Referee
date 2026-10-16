import fs from 'node:fs';
import crypto from 'node:crypto';

const source='production-schema.sql';
const baseline='CANONICAL-RUNTIME-BASELINE.sql';
const graphFile='PRODUCTION-FULL-DEPENDENCY-GRAPH.json';
const dependencyManifestFile='PRODUCTION-FULL-DEPENDENCY-MANIFEST.json';
const reportFile='CANONICAL-RUNTIME-BASELINE-REPORT.md';
const manifestFile='CANONICAL-RUNTIME-BASELINE-MANIFEST.json';
const hashFile='CANONICAL-RUNTIME-BASELINE-HASH.txt';
const expected={tables:27,columns:249,primary_keys:27,unique_constraints:7,check_constraints:3,foreign_keys:30,functions:47,views:3,materialized_views:0,triggers:22,rls_policies:86,indexes:47,extensions:7,enum_types:2};
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const args=text=>text.trim()?text.split(/,(?![^()]*\))/).map(x=>x.replaceAll('"','').replace(/\s+DEFAULT\s+[\s\S]*$/i,'').trim().split(/\s+/).slice(1).join(' ')).join(','):'';
function statements(s){const out=[];let start=0,quote=null,dollar=null;for(let i=0;i<s.length;i++){if(dollar){if(s.startsWith(dollar,i)){i+=dollar.length-1;dollar=null;}continue;}if(quote){if(s[i]===quote){if(quote==="'"&&s[i+1]==="'")i++;else quote=null;}continue;}if(s[i]==="'"||s[i]==='"'){quote=s[i];continue;}if(s[i]==='$'){const tag=s.slice(i).match(/^\$[A-Za-z_0-9]*\$/)?.[0];if(tag){dollar=tag;i+=tag.length-1;continue;}}if(s[i]===';'){const st=s.slice(start,i+1).trim();if(st)out.push(st);start=i+1;}}return out;}
function catalog(sql){
  const tableBodies=[...sql.matchAll(/^CREATE TABLE IF NOT EXISTS "[^"]+"\."[^"]+" \(([\s\S]*?)\n\);$/gm)].map(x=>x[1]);
  const functionHeaders=[...sql.matchAll(/^CREATE OR REPLACE FUNCTION "([^"]+)"\."([^"]+)"\(([\s\S]*?)\) RETURNS /gm)];
  const functionIds=functionHeaders.map(x=>x[1]+'.'+x[2]+'('+args(x[3])+')');
  const top=statements(sql);
  const dml={insert:0,update:0,delete:0,merge:0,copy_from:0};
  for(const st of top){if(/^INSERT\b/i.test(st))dml.insert++;if(/^UPDATE\b/i.test(st))dml.update++;if(/^DELETE\b/i.test(st))dml.delete++;if(/^MERGE\b/i.test(st))dml.merge++;if(/^COPY\b[\s\S]*\bFROM\b/i.test(st))dml.copy_from++;}
  return {
    counts:{
      tables:tableBodies.length,
      columns:tableBodies.reduce((n,body)=>n+(body.match(/^\s+"[^"]+"/gm)?.length??0),0),
      primary_keys:(sql.match(/ADD CONSTRAINT "[^"]+" PRIMARY KEY/g)||[]).length,
      unique_constraints:(sql.match(/ADD CONSTRAINT "[^"]+" UNIQUE/g)||[]).length,
      check_constraints:(sql.match(/CONSTRAINT "[^"]+" CHECK/g)||[]).length,
      foreign_keys:(sql.match(/ADD CONSTRAINT "[^"]+" FOREIGN KEY/g)||[]).length,
      functions:functionHeaders.length,
      views:(sql.match(/^CREATE OR REPLACE VIEW /gm)||[]).length,
      materialized_views:(sql.match(/^CREATE MATERIALIZED VIEW /gm)||[]).length,
      triggers:(sql.match(/^CREATE OR REPLACE TRIGGER /gm)||[]).length,
      rls_policies:(sql.match(/^CREATE POLICY /gm)||[]).length,
      indexes:(sql.match(/^CREATE (?:UNIQUE )?INDEX /gm)||[]).length,
      extensions:(sql.match(/^CREATE EXTENSION IF NOT EXISTS /gm)||[]).length,
      enum_types:(sql.match(/^CREATE TYPE "[^"]+"\."[^"]+" AS ENUM /gm)||[]).length
    },
    functionIds,
    dml,
    authUsersFabricated:/CREATE TABLE(?: IF NOT EXISTS)? "auth"\."users"/.test(sql)
  };
}
if(process.argv.includes('--generate'))fs.writeFileSync(baseline,fs.readFileSync(source));
if(!fs.existsSync(baseline))throw new Error('Baseline is absent. Run with --generate.');
const sourceSql=fs.readFileSync(source,'utf8'), baselineSql=fs.readFileSync(baseline,'utf8');
const c=catalog(baselineSql), sourceCatalog=catalog(sourceSql), dependency=JSON.parse(fs.readFileSync(dependencyManifestFile,'utf8'));
const mismatch=Object.keys(expected).filter(key=>c.counts[key]!==expected[key]);
const sourceFidelity={byte_identical:sourceSql===baselineSql,source_sha256:sha(sourceSql),baseline_sha256:sha(baselineSql),catalog_counts_identical:JSON.stringify(c.counts)===JSON.stringify(sourceCatalog.counts),function_identities_identical:JSON.stringify(c.functionIds)===JSON.stringify(sourceCatalog.functionIds)};
const overloaded=c.functionIds.filter(x=>x.startsWith('public.search_referee_cards('));
const ambiguousFunctions=c.functionIds.length-new Set(c.functionIds).size;
const missingCanonicalIds=c.functionIds.filter(x=>!x.includes('.')||!x.includes('(')||!x.endsWith(')')).length;
const numericOidIdentities=c.functionIds.filter(x=>/^\d+$/.test(x)).length;
const hasDml=Object.values(c.dml).some(Boolean);
const validation={catalog_matches_expected:mismatch.length===0,source_fidelity:sourceFidelity,overloaded_functions:overloaded,ambiguous_functions:ambiguousFunctions,missing_canonical_ids:missingCanonicalIds,numeric_oid_identities:numericOidIdentities,dml:c.dml,no_production_data:!hasDml,auth_users_not_fabricated:!c.authUsersFabricated,unresolved_dependencies:dependency.dependency_counts.unresolved,external_managed_dependencies:dependency.dependency_counts.external_managed};
const pass=validation.catalog_matches_expected&&sourceFidelity.byte_identical&&sourceFidelity.catalog_counts_identical&&sourceFidelity.function_identities_identical&&!hasDml&&!c.authUsersFabricated&&!ambiguousFunctions&&!missingCanonicalIds&&!numericOidIdentities&&overloaded.length===2;
const hash=sha(baselineSql);
const manifest={artifact:'CANONICAL-RUNTIME-BASELINE',version:'1.0.0',source,dependency_source:graphFile,schema_only:true,production_execution:false,production_mutation:false,production_data:false,generator:'scripts/validate-canonical-runtime-baseline.mjs --generate',generated_at:new Date().toISOString(),sha256:hash,catalog:expected,validation,source_fidelity:sourceFidelity,gate:pass?'PASS':'BLOCKED'};
const report=['# PRODUCTION-CANONICAL-RUNTIME-BASELINE v1.0.0','','Offline schema-only artifact. Production was not connected, executed, mutated, or queried for data.','','## Validation','',...Object.entries(c.counts).map(x=>'- '+x[0]+': '+x[1]),'','## Safety','',...Object.entries(c.dml).map(x=>'- '+x[0]+': '+x[1]),'- auth.users fabricated: '+c.authUsersFabricated,'','## Source fidelity','',...Object.entries(sourceFidelity).map(x=>'- '+x[0]+': '+x[1]),'','## Dependency evidence','', '- total: '+dependency.dependency_counts.total,'- resolved: '+dependency.dependency_counts.resolved,'- unresolved: '+dependency.dependency_counts.unresolved,'- external managed: '+dependency.dependency_counts.external_managed,'','## Gate','','CANONICAL RUNTIME BASELINE: **'+manifest.gate+'**','','Production Deployment: **NOT AUTHORIZED**',''].join('\n');
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(reportFile,report);
fs.writeFileSync(hashFile,hash+'\n');
const line=(label,value)=>label.padEnd(27)+': '+value;
console.log(['============================================================',' PRODUCTION-CANONICAL-RUNTIME-BASELINE v1.0.0','============================================================','','SOURCE:',source,'','DEPENDENCY GRAPH:',graphFile,'','PRODUCTION CONNECTION:','NOT USED','','PRODUCTION EXECUTION:','NOT EXECUTED','','PRODUCTION MUTATION:','NOT EXECUTED','','PRODUCTION DATA:','NOT EXTRACTED','','------------------------------------------------------------','CATALOG FIDELITY','------------------------------------------------------------','',line('Tables',c.counts.tables),line('Columns',c.counts.columns),line('Primary Keys',c.counts.primary_keys),line('Unique Constraints',c.counts.unique_constraints),line('Check Constraints',c.counts.check_constraints),line('Foreign Keys',c.counts.foreign_keys),line('Functions',c.counts.functions),line('Views',c.counts.views),line('Materialized Views',c.counts.materialized_views),line('Triggers',c.counts.triggers),line('RLS Policies',c.counts.rls_policies),line('Indexes',c.counts.indexes),line('Extensions',c.counts.extensions),line('Enum Types',c.counts.enum_types),'','------------------------------------------------------------','DATA SAFETY','------------------------------------------------------------','',line('INSERT statements',c.dml.insert),line('UPDATE statements',c.dml.update),line('DELETE statements',c.dml.delete),line('MERGE statements',c.dml.merge),line('COPY FROM data statements',c.dml.copy_from),'','------------------------------------------------------------','IDENTITY','------------------------------------------------------------','',line('Ambiguous functions',ambiguousFunctions),line('Missing canonical IDs',missingCanonicalIds),line('Numeric OID identities',numericOidIdentities),'','------------------------------------------------------------','DEPENDENCY','------------------------------------------------------------','',line('Total source dependencies',dependency.dependency_counts.total),line('Resolved',dependency.dependency_counts.resolved),line('Unresolved',dependency.dependency_counts.unresolved),line('External managed',dependency.dependency_counts.external_managed),'','------------------------------------------------------------','DETERMINISM','------------------------------------------------------------','',line('Run SHA-256',hash),line('Hashes identical','Validated by caller'),'','------------------------------------------------------------','GATE','------------------------------------------------------------','','CANONICAL RUNTIME BASELINE:',manifest.gate,'','------------------------------------------------------------','DEPLOYMENT','------------------------------------------------------------','','Production Deployment:','NOT AUTHORIZED'].join('\n'));
if(!pass)process.exitCode=1;
