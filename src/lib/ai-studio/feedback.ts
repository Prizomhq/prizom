import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AIPromptDelta } from './schema';

/**
 * Computes Levenshtein edit distance between two strings.
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates edit delta metrics between AI output and user modifications,
 * saving record into ai_prompt_deltas for dataset training.
 */
export async function recordPromptDeltaFeedback(
  sessionId: string,
  originalAiPrompt: string,
  userModifiedPrompt: string,
  modifiedFields: string[] = ['prompt_text'],
  customClient?: any
): Promise<AIPromptDelta> {
  const supabase = customClient || (await createAdminClient());

  const distance = computeLevenshteinDistance(originalAiPrompt, userModifiedPrompt);
  const charAdded = Math.max(0, userModifiedPrompt.length - originalAiPrompt.length);
  const charRemoved = Math.max(0, originalAiPrompt.length - userModifiedPrompt.length);

  const { data, error } = await supabase
    .from('ai_prompt_deltas')
    .insert([
      {
        session_id: sessionId,
        original_ai_prompt: originalAiPrompt,
        user_modified_prompt: userModifiedPrompt,
        levenshtein_distance: distance,
        character_added_count: charAdded,
        character_removed_count: charRemoved,
        modified_fields: modifiedFields
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[FEEDBACK DELTA ERROR] Failed to save prompt delta record:', error.message);
    throw error;
  }

  return data as AIPromptDelta;
}
