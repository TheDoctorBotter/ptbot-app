/**
 * EMR Export Edge Function
 *
 * Server-side proxy for exporting SOAP notes and patient records to Buckeye EMR.
 * API key is stored securely as a Supabase secret and never exposed to the client.
 *
 * Required Supabase secrets:
 *   EMR_BASE_URL  - https://emr.buckeyephysicaltherapy.org
 *   EMR_API_KEY   - API key for Buckeye EMR
 *
 * Endpoints handled:
 *   POST /emr-export  { type: 'consult_note', payload: {...} }
 *   POST /emr-export  { type: 'patient', payload: {...} }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  type: 'consult_note' | 'patient';
  payload: Record<string, unknown>;
  note_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caller is an authenticated admin/clinician
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is admin or clinician
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'clinician'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: admin/clinician access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ExportRequest = await req.json();
    const { type, payload, note_id } = body;

    if (!type || !payload) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing type or payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get EMR configuration from secrets
    const emrBaseUrl = Deno.env.get('EMR_BASE_URL') ?? 'https://emr.buckeyephysicaltherapy.org';
    const emrApiKey = Deno.env.get('EMR_API_KEY');

    if (!emrApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'EMR_API_KEY not configured. Please add it to your Supabase project secrets.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine EMR endpoint based on type
    const emrEndpoint = type === 'consult_note'
      ? '/api/ptbot/consult-notes'
      : '/api/ptbot/patients';

    // Forward to Buckeye EMR
    const emrResponse = await fetch(`${emrBaseUrl}${emrEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${emrApiKey}`,
        'X-PTBot-Source': 'ptbot-telehealth',
        'X-PTBot-User': user.id,
      },
      body: JSON.stringify({
        ...payload,
        source: 'ptbot_telehealth',
        synced_at: new Date().toISOString(),
      }),
    });

    const emrData = await emrResponse.json().catch(() => ({}));

    if (!emrResponse.ok) {
      console.error('[emr-export] EMR API error', {
        status: emrResponse.status,
        endpoint: emrEndpoint,
        error: emrData.error || emrData.message,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: emrData.error || emrData.message || `EMR returned HTTP ${emrResponse.status}`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If this was a consult note export and we have a note_id, mark it as synced
    if (type === 'consult_note' && note_id && emrData.record_id) {
      const adminSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await adminSupabase
        .from('consult_notes')
        .update({
          emr_synced: true,
          emr_record_id: emrData.record_id,
          emr_synced_at: new Date().toISOString(),
        })
        .eq('id', note_id);
    }

    console.log('[emr-export] Export successful', {
      type,
      emrRecordId: emrData.record_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        record_id: emrData.record_id,
        message: `${type === 'consult_note' ? 'SOAP note' : 'Patient'} exported to Buckeye EMR successfully.`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[emr-export] Unexpected error', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error during EMR export',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
