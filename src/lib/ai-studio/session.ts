import { createClient } from '@/lib/supabase/server';
import { AIStudioSession, AIPromptVersion, AGRouterPromptResponse } from './schema';

/**
 * Creates a new AI Studio session entry in the database.
 */
export async function createStudioSession(
  userId: string,
  cloudinaryUrl: string,
  cloudinaryPublicId: string,
  requestId: string,
  customClient?: any
): Promise<AIStudioSession> {
  const supabase = customClient || (await createClient());

  const { data, error } = await supabase
    .from('ai_studio_sessions')
    .insert([
      {
        user_id: userId,
        cloudinary_url: cloudinaryUrl,
        cloudinary_public_id: cloudinaryPublicId,
        request_id: requestId,
        status: 'pending',
        active_version: 1
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[SESSION UTILS ERROR] Failed to create session:', error.message);
    throw new Error(`Failed to initialize studio session: ${error.message}`);
  }

  return data as AIStudioSession;
}

/**
 * Updates the status of an existing studio session.
 */
export async function updateStudioSessionStatus(
  sessionId: string,
  status: AIStudioSession['status'],
  errorMessage: string | null = null,
  customClient?: any
): Promise<void> {
  const supabase = customClient || (await createClient());

  const { error } = await supabase
    .from('ai_studio_sessions')
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[SESSION UTILS ERROR] Failed to update session status:', error.message);
    throw new Error(`Failed to update studio session status: ${error.message}`);
  }
}

/**
 * Updates the active version and sets status to complete.
 */
export async function completeStudioSession(
  sessionId: string,
  versionNumber: number,
  customClient?: any
): Promise<void> {
  const supabase = customClient || (await createClient());

  const { error } = await supabase
    .from('ai_studio_sessions')
    .update({
      status: 'complete',
      active_version: versionNumber,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[SESSION UTILS ERROR] Failed to complete session:', error.message);
    throw new Error(`Failed to complete studio session: ${error.message}`);
  }
}

/**
 * Saves a prompt version iteration.
 */
export async function savePromptVersion(
  sessionId: string,
  versionNumber: number,
  promptText: string,
  negativePrompt: string | null,
  generationSettings: Record<string, any> = {},
  agRouterResponse: AGRouterPromptResponse | null = null,
  createdByAi: boolean = true,
  customClient?: any
): Promise<AIPromptVersion> {
  const supabase = customClient || (await createClient());

  const { data, error } = await supabase
    .from('ai_prompt_versions')
    .insert([
      {
        session_id: sessionId,
        version_number: versionNumber,
        prompt_text: promptText,
        negative_prompt: negativePrompt,
        generation_settings: generationSettings,
        ag_router_response: agRouterResponse,
        created_by_ai: createdByAi
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[SESSION UTILS ERROR] Failed to save prompt version:', error.message);
    throw new Error(`Failed to save prompt version iteration: ${error.message}`);
  }

  return data as AIPromptVersion;
}

/**
 * Retrieves a session draft complete with version iterations.
 */
export async function getStudioSession(
  sessionId: string,
  customClient?: any
): Promise<{ session: AIStudioSession; versions: AIPromptVersion[] } | null> {
  const supabase = customClient || (await createClient());

  const { data: session, error: sessError } = await supabase
    .from('ai_studio_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessError) {
    console.error('[SESSION UTILS ERROR] Failed to fetch session:', sessError.message);
    throw sessError;
  }

  if (!session) return null;

  const { data: versions, error: versError } = await supabase
    .from('ai_prompt_versions')
    .select('*')
    .eq('session_id', sessionId)
    .order('version_number', { ascending: true });

  if (versError) {
    console.error('[SESSION UTILS ERROR] Failed to fetch versions:', versError.message);
    throw versError;
  }

  return {
    session: session as AIStudioSession,
    versions: (versions || []) as AIPromptVersion[]
  };
}
