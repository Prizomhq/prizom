'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { createPromptAction as createStandardPrompt } from '@/app/actions/prompts';

export function StudioPublishPanel() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const router = useRouter();

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    const { title, promptText, negativePrompt, category, tags, aiTool, aspectRatio } = state.userEdits;

    if (!title || title.trim().length < 3) {
      setError('Title must be at least 3 characters long.');
      return;
    }

    if (!promptText || promptText.trim().length < 10) {
      setError('Main prompt must be at least 10 characters long.');
      return;
    }

    setError(null);
    setIsPublishing(true);
    dispatch({ type: 'SUBMIT_PUBLISH' });

    try {
      // Call standard prompt publishing server action
      const res = await createStandardPrompt({
        title: title.trim(),
        prompt_text: promptText.trim(),
        negative_prompt: negativePrompt?.trim() || undefined,
        ai_tool: aiTool || 'Midjourney',
        category: category || 'General',
        tags: tags || [],
        image_url: state.uploadedImageUrl || undefined,
        aspect_ratio: aspectRatio || '1:1',
        prompt_type: 'image'
      });

      if (!res.success || !res.data || res.data.length === 0) {
        throw new Error(res.error || 'Failed to publish prompt.');
      }

      dispatch({ type: 'PUBLISH_SUCCESS', promptId: res.data[0].id });
      router.push(`/prompt/${res.data[0].id}`);

    } catch (err: any) {
      console.error('[STUDIO PUBLISH ERROR]', err);
      setError(err.message || 'An unexpected error occurred while publishing.');
      dispatch({ type: 'SET_ERROR', message: err.message || 'Publishing failed.' });
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Review & Publish
          </h3>
          <p className="text-zinc-400 text-xs font-medium mt-1">
            All fields are formatted and ready. You can edit parameters anytime after publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: 'RESET_FLOW' })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-300 bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Start Over
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-300 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-full sm:w-auto flex-1 py-4 px-8 rounded-full text-sm font-extrabold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Publishing to Prizom...
            </>
          ) : (
            <>
              Publish Prompt <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
