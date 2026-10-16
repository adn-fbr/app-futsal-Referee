import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMPORTABLE_TABLES = [
  'profiles',
  'events', 
  'event_assignments',
  'event_approvals',
  'honors',
  'evaluations',
  'evaluation_scores',
  'kabupaten_kota',
  'user_roles',
  'pengurus',
] as const;

type ImportableTable = typeof IMPORTABLE_TABLES[number];

interface ImportResult {
  table: string;
  success: number;
  failed: number;
  errors: string[];
}

function parseCSV(csvContent: string): Record<string, unknown>[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, unknown> = {};
    
    headers.forEach((header, index) => {
      let value: unknown = values[index] || null;
      
      // Try to parse JSON values (for arrays, objects)
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      // Parse booleans
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      
      // Parse null
      if (value === 'null' || value === '') value = null;
      
      row[header] = value;
    });
    
    rows.push(row);
  }

  return rows;
}

function sanitizeRecord(record: Record<string, unknown>, table: string): Record<string, unknown> {
  const sanitized = { ...record };
  
  // Remove system-managed fields that shouldn't be imported
  delete sanitized.created_at;
  delete sanitized.updated_at;
  delete sanitized.deleted_at;
  
  // For profiles table, be careful with sensitive fields
  if (table === 'profiles') {
    delete sanitized.approved_at;
    delete sanitized.approved_by;
  }
  
  return sanitized;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 401, message: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create client with user token to verify identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ code: 401, message: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin_provinsi
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const caller = await resolveCaller(req, supabase);
    if (!caller) {
      return new Response(JSON.stringify({ code: 401, message: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!hasAnyRole(caller, ["admin_provinsi"])) {
      return new Response(JSON.stringify({ code: 403, message: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin_provinsi', { 
      _user_id: user.id 
    });

    if (roleError || !isAdmin) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ code: 403, message: "Hanya Admin Provinsi yang dapat mengimport data" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const contentType = req.headers.get("content-type") || "";
    let importData: { table: string; records: Record<string, unknown>[] }[] = [];
    let format = 'json';
    let conflictStrategy = 'skip'; // 'skip', 'update', 'replace'

    if (contentType.includes("application/json")) {
      const body = await req.json();
      importData = body.data || [];
      format = body.format || 'json';
      conflictStrategy = body.conflictStrategy || 'skip';
    } else {
      return new Response(
        JSON.stringify({ code: 400, message: "Content-Type must be application/json" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Import request: ${importData.length} tables, format: ${format}, strategy: ${conflictStrategy}`);

    const results: ImportResult[] = [];
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const { table, records } of importData) {
      // Validate table name
      if (!IMPORTABLE_TABLES.includes(table as ImportableTable)) {
        results.push({
          table,
          success: 0,
          failed: records.length,
          errors: [`Table '${table}' tidak diizinkan untuk import`],
        });
        totalFailed += records.length;
        continue;
      }

      const tableResult: ImportResult = {
        table,
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const record of records) {
        try {
          const sanitizedRecord = sanitizeRecord(record, table);
          
          if (conflictStrategy === 'update' && sanitizedRecord.id) {
            // Upsert - update if exists, insert if not
            const { error } = await supabase
              .from(table)
              .upsert(sanitizedRecord, { onConflict: 'id' });
            
            if (error) throw error;
            tableResult.success++;
          } else if (conflictStrategy === 'skip' && sanitizedRecord.id) {
            // Check if exists first
            const { data: existing } = await supabase
              .from(table)
              .select('id')
              .eq('id', sanitizedRecord.id)
              .single();
            
            if (existing) {
              // Skip existing records
              tableResult.success++;
            } else {
              const { error } = await supabase
                .from(table)
                .insert(sanitizedRecord);
              
              if (error) throw error;
              tableResult.success++;
            }
          } else {
            // Insert new records (remove id to let DB generate it)
            const recordWithoutId = { ...sanitizedRecord };
            delete recordWithoutId.id;
            
            const { error } = await supabase
              .from(table)
              .insert(recordWithoutId);
            
            if (error) throw error;
            tableResult.success++;
          }
        } catch (err) {
          tableResult.failed++;
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (tableResult.errors.length < 5) {
            tableResult.errors.push(`Record error: ${errorMessage}`);
          }
          console.error(`Import error for ${table}:`, errorMessage);
        }
      }

      totalSuccess += tableResult.success;
      totalFailed += tableResult.failed;
      results.push(tableResult);
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      entity_type: "database_import",
      entity_id: user.id,
      action: "IMPORT",
      actor_id: user.id,
      metadata: {
        tables: importData.map(d => d.table),
        format,
        conflict_strategy: conflictStrategy,
        total_success: totalSuccess,
        total_failed: totalFailed,
      },
    });

    console.log(`Import completed: ${totalSuccess} success, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total_success: totalSuccess,
          total_failed: totalFailed,
        },
        imported_at: new Date().toISOString(),
        imported_by: user.email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ 
        code: 500, 
        message: error instanceof Error ? error.message : "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
