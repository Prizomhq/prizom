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
  meta?: { width?: number; height?: number; aspectRatio?: string },
  customClient?: any
): Promise<AIStudioSession> {
  const supabase = customClient || (await createClient());

  const insertData: any = {
    user_id: userId,
    cloudinary_url: cloudinaryUrl,
    cloudinary_public_id: cloudinaryPublicId,
    request_id: requestId,
    status: 'pending',
    active_version: 1
  };

  if (meta?.aspectRatio) {
    insertData.aspect_ratio = meta.aspectRatio;
  }

  let { data, error } = await supabase
    .from('ai_studio_sessions')
    .insert([insertData])
    .select()
    .single();

  // If column aspect_ratio does not exist in schema cache, fallback to inserting without it
  if (error && error.message && error.message.includes('aspect_ratio')) {
    console.warn('[SESSION UTILS] aspect_ratio column missing in remote schema, retrying base session insert...');
    delete insertData.aspect_ratio;
    const retry = await supabase
      .from('ai_studio_sessions')
      .insert([insertData])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

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

/**
 * Retrieves all studio sessions for a specific user.
 */
export async function getUserStudioSessions(
  userId: string,
  limit: number = 30,
  customClient?: any
): Promise<{ session: AIStudioSession; latestVersion: AIPromptVersion | null }[]> {
  const supabase = customClient || (await createClient());

  const { data: sessions, error } = await supabase
    .from('ai_studio_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[SESSION UTILS ERROR] Failed to fetch user sessions:', error.message);
    return [];
  }

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s: any) => s.id);
  const { data: versions } = await supabase
    .from('ai_prompt_versions')
    .select('*')
    .in('session_id', sessionIds)
    .order('version_number', { ascending: false });

  const result = sessions.map((sess: any) => {
    const latestVersion = (versions || []).find((v: any) => v.session_id === sess.id) || null;
    return {
      session: sess as AIStudioSession,
      latestVersion: latestVersion as AIPromptVersion | null
    };
  });

  return result;
}

/**
 * Deletes a studio session and associated version iterations for a user.
 */
export async function deleteStudioSession(
  sessionId: string,
  userId: string,
  customClient?: any
): Promise<boolean> {
  const supabase = customClient || (await createClient());

  // 1. Delete associated prompt versions first
  await supabase
    .from('ai_prompt_versions')
    .delete()
    .eq('session_id', sessionId);

  // 2. Delete associated prompt deltas
  await supabase
    .from('ai_prompt_deltas')
    .delete()
    .eq('session_id', sessionId);

  // 3. Delete master studio session
  const { error } = await supabase
    .from('ai_studio_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    console.error('[SESSION UTILS ERROR] Failed to delete session:', error.message);
    return false;
  }

  return true;
}

