import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tables that can be exported
const EXPORTABLE_TABLES = [
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
  'audit_logs',
] as const;

type ExportableTable = typeof EXPORTABLE_TABLES[number];

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const caller = await resolveCaller(req, supabase);
    if (!caller) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!hasAnyRole(caller, ['admin_provinsi'])) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user and check admin provinsi role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin_provinsi (only admin_provinsi can export)
    const { data: isAdminProvinsi } = await supabase.rpc('is_admin_provinsi', { _user_id: user.id });
    if (!isAdminProvinsi) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin Provinsi access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const tables = url.searchParams.get('tables')?.split(',').filter(t => EXPORTABLE_TABLES.includes(t as ExportableTable)) || [...EXPORTABLE_TABLES];
    const format = url.searchParams.get('format') || 'json'; // json or csv
    const startDate = url.searchParams.get('start_date') || null;
    const endDate = url.searchParams.get('end_date') || null;

    console.log(`Export requested by ${user.id}: tables=${tables.join(',')}, format=${format}, startDate=${startDate}, endDate=${endDate}`);

    const exportData: Record<string, unknown[]> = {};
    const errors: string[] = [];

    for (const table of tables) {
      try {
        let query = supabase.from(table).select('*');

        // Apply date filter for tables with created_at
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          query = query.lte('created_at', endDate + 'T23:59:59.999Z');
        }

        // Order by created_at if available
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          errors.push(`${table}: ${error.message}`);
        } else {
          exportData[table] = data || [];
        }
      } catch (err) {
        console.error(`Error processing ${table}:`, err);
        errors.push(`${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Log the export action to audit_logs
    await supabase.from('audit_logs').insert({
      entity_type: 'database_export',
      entity_id: user.id,
      action: 'EXPORT',
      actor_id: user.id,
      metadata: {
        tables: tables,
        format: format,
        start_date: startDate,
        end_date: endDate,
        record_counts: Object.fromEntries(
          Object.entries(exportData).map(([table, data]) => [table, (data as unknown[]).length])
        ),
      },
    });

    // Prepare response based on format
    if (format === 'csv') {
      // For CSV, we'll return a zip-like structure or multiple files info
      const csvData: Record<string, string> = {};
      for (const [table, data] of Object.entries(exportData)) {
        csvData[table] = convertToCSV(data as Record<string, unknown>[]);
      }

      return new Response(
        JSON.stringify({ 
          data: csvData, 
          format: 'csv',
          errors: errors.length > 0 ? errors : undefined,
          exported_at: new Date().toISOString(),
          exported_by: user.id,
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
          } 
        }
      );
    }

    // Default: JSON format
    return new Response(
      JSON.stringify({ 
        data: exportData, 
        format: 'json',
        errors: errors.length > 0 ? errors : undefined,
        exported_at: new Date().toISOString(),
        exported_by: user.id,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
