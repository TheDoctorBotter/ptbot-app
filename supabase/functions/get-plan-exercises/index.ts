/**
 * get-plan-exercises  (GET, auth required)
 *
 * Returns the saved exercise recommendations for the requesting user's
 * most recent assessment for a given condition, enforcing the free-tier
 * limit of 2 exercises server-side.
 *
 * Query params:
 *   condition  string  (pain_location, e.g. "Knee") — optional filter
 *
 * Response:
 *   { ok, exercises: ExerciseRecommendation[], total, entitled, preview_count }
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const FREE_PREVIEW = 2;

function cors(body: unknown, status = 200) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  if (req.method !== 'GET') return cors({ error: 'Method not allowed' }, 405);

  // ── Auth ───────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return cors({ error: 'Missing Authorization header' }, 401);

  const { data: { user }, error: authErr } =
    await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !user) return cors({ error: 'Unauthorized' }, 401);

  const url = new URL(req.url);
  const condition = url.searchParams.get('condition') ?? undefined;

  // ── Fetch most recent assessment for this user (+ optional condition) ──
  let assessmentQuery = supabase
    .from('assessments')
    .select('id, pain_location, recommendations')
    .eq('user_id', user.id)
    .not('recommendations', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (condition) {
    assessmentQuery = assessmentQuery.ilike('pain_location', condition);
  }

  const { data: assessments, error: aErr } = await assessmentQuery;
  if (aErr) {
    console.error('[get-plan-exercises] assessment query:', aErr.message);
    return cors({ error: 'Failed to fetch assessment' }, 500);
  }

  const assessment = assessments?.[0];
  if (!assessment) {
    return cors({ ok: true, exercises: [], total: 0, entitled: false, preview_count: FREE_PREVIEW });
  }

  const allExercises: unknown[] = Array.isArray(assessment.recommendations)
    ? assessment.recommendations
    : [];

  // ── Check entitlements ─────────────────────────────────────────────────
  const entitled = await isEntitled(user.id, condition ?? assessment.pain_location);

  const exercises = entitled ? allExercises : allExercises.slice(0, FREE_PREVIEW);

  return cors({
    ok: true,
    assessment_id:  assessment.id,
    condition:      assessment.pain_location,
    exercises,
    total:          allExercises.length,
    entitled,
    preview_count:  FREE_PREVIEW,
  });
});

async function isEntitled(userId: string, condition?: string): Promise<boolean> {
  // Check for unlimited plans (subscription)
  const { data: unlimited } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('entitlement_key', 'unlimited_plans')
    .eq('active', true)
    .maybeSingle();

  if (unlimited) return true;

  if (!condition) return false;

  // Check for scoped full_plan_access
  const { data: scoped } = await supabase
    .from('entitlements')
    .select('id, scope_json')
    .eq('user_id', userId)
    .eq('entitlement_key', 'full_plan_access')
    .eq('active', true);

  if (!scoped?.length) return false;

  const norm = condition.toLowerCase();
  return scoped.some((e) => {
    const scope = e.scope_json as Record<string, string> | null;
    if (!scope || Object.keys(scope).length === 0) return true; // global grant
    return (scope.condition ?? '').toLowerCase() === norm;
  });
}
