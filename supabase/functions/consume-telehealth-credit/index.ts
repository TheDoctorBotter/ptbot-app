/**
 * consume-telehealth-credit  (POST, auth required)
 *
 * Atomically deducts 1 telehealth credit from the authenticated user's
 * oldest available credit pool.  Returns the result so the caller can
 * handle the "no credit" case before booking.
 *
 * POST body:
 *   { appointment_id: string }
 *
 * Response:
 *   { ok: true }               — credit consumed
 *   { ok: false, error: "..." } — no credits available (402)
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function cors(body: unknown, status = 200) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  if (status === 204) return new Response(null, { status, headers: h });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...h, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors(null, 204);
  if (req.method !== 'POST') return cors({ error: 'Method not allowed' }, 405);

  // ── Auth ───────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return cors({ error: 'Missing Authorization header' }, 401);

  const { data: { user }, error: authErr } =
    await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !user) return cors({ error: 'Unauthorized' }, 401);

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: { appointment_id?: string };
  try { body = await req.json(); }
  catch { return cors({ error: 'Invalid JSON body' }, 400); }

  if (!body.appointment_id) {
    return cors({ error: 'Missing appointment_id' }, 400);
  }

  // ── Invoke DB function (atomic, SECURITY DEFINER) ──────────────────────
  const { data: consumed, error: rpcErr } = await supabase
    .rpc('consume_telehealth_credit', {
      p_user_id:       user.id,
      p_appointment_id: body.appointment_id,
    });

  if (rpcErr) {
    console.error('[consume-telehealth-credit] RPC error:', rpcErr.message);
    return cors({ error: 'Failed to consume credit' }, 500);
  }

  if (!consumed) {
    return cors({ ok: false, error: 'No telehealth credits available' }, 402);
  }

  console.log(`[consume-telehealth-credit] Consumed credit for user ${user.id.slice(0, 8)} appt=${body.appointment_id}`);
  return cors({ ok: true });
});
