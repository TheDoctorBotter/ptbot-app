import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

// Rate limiting: track requests per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // max requests per minute per user

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

// Check rate limit for a user
function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  userLimit.count++;
  return { allowed: true };
}

// Input validation schemas
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  action: 'chat';
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface SafetyNotesRequest {
  action: 'safety-notes';
  assessment: {
    painLevel: number;
    painLocation: string;
    painType: string;
    painDuration: string;
    additionalSymptoms: string[];
  };
  exercise: {
    title: string;
    description: string;
    difficulty: string;
    bodyParts: string[];
    contraindications: string[];
  };
}

interface VideoAnalysisRequest {
  action: 'video-analysis';
  video: {
    title: string;
    description: string;
  };
}

type ProxyRequest = ChatRequest | SafetyNotesRequest | VideoAnalysisRequest;

// Validate and sanitize input
function validateInput(body: unknown): { valid: true; data: ProxyRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const request = body as Record<string, unknown>;
  const action = request.action;

  if (!action || typeof action !== 'string') {
    return { valid: false, error: 'Missing or invalid action parameter' };
  }

  switch (action) {
    case 'chat': {
      const messages = request.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        return { valid: false, error: 'Messages must be a non-empty array' };
      }
      if (messages.length > 10) {
        return { valid: false, error: 'Too many messages (max 10)' };
      }
      for (const msg of messages) {
        if (!msg || typeof msg !== 'object') {
          return { valid: false, error: 'Invalid message format' };
        }
        if (!['system', 'user', 'assistant'].includes(msg.role)) {
          return { valid: false, error: 'Invalid message role' };
        }
        if (typeof msg.content !== 'string' || msg.content.length > 5000) {
          return { valid: false, error: 'Invalid or too long message content' };
        }
      }
      const maxTokens = request.max_tokens;
      if (maxTokens !== undefined && (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 1000)) {
        return { valid: false, error: 'max_tokens must be between 1 and 1000' };
      }
      const temperature = request.temperature;
      if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
        return { valid: false, error: 'temperature must be between 0 and 2' };
      }
      return {
        valid: true,
        data: {
          action: 'chat',
          messages: messages as ChatMessage[],
          max_tokens: maxTokens as number | undefined,
          temperature: temperature as number | undefined,
        },
      };
    }

    case 'safety-notes': {
      const assessment = request.assessment;
      const exercise = request.exercise;
      if (!assessment || typeof assessment !== 'object') {
        return { valid: false, error: 'Missing or invalid assessment' };
      }
      if (!exercise || typeof exercise !== 'object') {
        return { valid: false, error: 'Missing or invalid exercise' };
      }
      const a = assessment as Record<string, unknown>;
      const e = exercise as Record<string, unknown>;
      if (typeof a.painLevel !== 'number' || a.painLevel < 0 || a.painLevel > 10) {
        return { valid: false, error: 'Invalid painLevel (must be 0-10)' };
      }
      if (typeof a.painLocation !== 'string' || a.painLocation.length > 200) {
        return { valid: false, error: 'Invalid painLocation' };
      }
      if (typeof e.title !== 'string' || e.title.length > 500) {
        return { valid: false, error: 'Invalid exercise title' };
      }
      return {
        valid: true,
        data: {
          action: 'safety-notes',
          assessment: {
            painLevel: a.painLevel as number,
            painLocation: a.painLocation as string,
            painType: (a.painType as string) || '',
            painDuration: (a.painDuration as string) || '',
            additionalSymptoms: Array.isArray(a.additionalSymptoms) ? a.additionalSymptoms.filter((s): s is string => typeof s === 'string').slice(0, 20) : [],
          },
          exercise: {
            title: e.title as string,
            description: ((e.description as string) || '').slice(0, 2000),
            difficulty: (e.difficulty as string) || 'Beginner',
            bodyParts: Array.isArray(e.bodyParts) ? e.bodyParts.filter((s): s is string => typeof s === 'string').slice(0, 20) : [],
            contraindications: Array.isArray(e.contraindications) ? e.contraindications.filter((s): s is string => typeof s === 'string').slice(0, 20) : [],
          },
        },
      };
    }

    case 'video-analysis': {
      const video = request.video;
      if (!video || typeof video !== 'object') {
        return { valid: false, error: 'Missing or invalid video' };
      }
      const v = video as Record<string, unknown>;
      if (typeof v.title !== 'string' || v.title.length > 500) {
        return { valid: false, error: 'Invalid video title' };
      }
      return {
        valid: true,
        data: {
          action: 'video-analysis',
          video: {
            title: v.title as string,
            description: ((v.description as string) || '').slice(0, 5000),
          },
        },
      };
    }

    default:
      return { valid: false, error: `Unknown action: ${action}` };
  }
}

// Build OpenAI request based on action
function buildOpenAIRequest(data: ProxyRequest): { messages: ChatMessage[]; max_tokens: number; temperature: number } {
  switch (data.action) {
    case 'chat':
      return {
        messages: data.messages,
        max_tokens: data.max_tokens ?? 300,
        temperature: data.temperature ?? 0.7,
      };

    case 'safety-notes':
      return {
        messages: [
          {
            role: 'system',
            content: `You are a physical therapy expert. Generate specific safety notes for this exercise based on the patient's condition. Return ONLY a JSON array of safety notes:

            ["safety note 1", "safety note 2", "safety note 3"]

            Focus on:
            - Modifications for their pain level
            - Precautions for their specific symptoms
            - When to stop the exercise
            - Progression guidelines

            Keep each note concise and actionable.`,
          },
          {
            role: 'user',
            content: `Patient Assessment:
            Pain Level: ${data.assessment.painLevel}/10
            Location: ${data.assessment.painLocation}
            Pain Type: ${data.assessment.painType}
            Duration: ${data.assessment.painDuration}
            Additional Symptoms: ${data.assessment.additionalSymptoms.join(', ')}

            Exercise: ${data.exercise.title}
            Description: ${data.exercise.description}
            Difficulty: ${data.exercise.difficulty}
            Target Body Parts: ${data.exercise.bodyParts.join(', ')}
            Contraindications: ${data.exercise.contraindications.join(', ')}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
      };

    case 'video-analysis':
      return {
        messages: [
          {
            role: 'system',
            content: `You are analyzing a YouTube video from Dr. Justin Lemmo's physical therapy channel. Extract detailed exercise information.

Return ONLY a JSON object with this exact structure:
{
  "isExerciseVideo": boolean (true only if this is an exercise, stretch, or rehabilitation video),
  "bodyParts": ["specific body parts: neck, upper back, lower back, shoulder, elbow, wrist, hip, knee, ankle, etc."],
  "conditions": ["specific conditions: herniated disc, sciatica, rotator cuff, plantar fasciitis, etc."],
  "difficulty": "Beginner|Intermediate|Advanced",
  "keywords": ["terms patients would search for"],
  "painTypes": ["types of pain addressed"],
  "targetAudience": ["who this is designed for"],
  "contraindications": ["when NOT to do this exercise"],
  "estimatedDuration": "estimated time in minutes"
}

Only return isExerciseVideo: true if this is actually a physical therapy, exercise, or rehabilitation video. Be very specific about body parts and conditions.`,
          },
          {
            role: 'user',
            content: `Title: ${data.video.title}\n\nDescription: ${data.video.description}`,
          },
        ],
        max_tokens: 400,
        temperature: 0.1,
      };
  }
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    // Verify OpenAI API key is configured
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return corsResponse({ error: 'Service not configured' }, 500);
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    console.log('[openai-proxy] Auth header present:', !!authHeader);

    if (!authHeader) {
      console.log('[openai-proxy] No auth header');
      return corsResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[openai-proxy] Token length:', token.length);

    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    console.log('[openai-proxy] getUser result - user:', !!user, 'error:', getUserError?.message || 'none');

    if (getUserError || !user) {
      console.log('[openai-proxy] Auth failed:', getUserError?.message || 'no user');
      return corsResponse({ error: 'Unauthorized', details: getUserError?.message }, 401);
    }

    console.log('[openai-proxy] Auth success for user:', user.id.slice(0, 8));

    // Check rate limit
    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      return corsResponse(
        { error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` },
        429
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return corsResponse({ error: 'Invalid JSON body' }, 400);
    }

    const validation = validateInput(body);
    if (!validation.valid) {
      return corsResponse({ error: validation.error }, 400);
    }

    const requestData = validation.data;
    const openAIPayload = buildOpenAIRequest(requestData);

    // Log request (without sensitive data)
    console.log(`OpenAI proxy request: action=${requestData.action}, user=${user.id.slice(0, 8)}...`);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIPayload.messages,
        max_tokens: openAIPayload.max_tokens,
        temperature: openAIPayload.temperature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data.error?.message || 'Unknown error');
      return corsResponse({ error: 'Failed to process request' }, 500);
    }

    // Return successful response
    return corsResponse({
      content: data.choices[0].message.content,
      usage: data.usage,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`OpenAI proxy error: ${message}`);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
});
