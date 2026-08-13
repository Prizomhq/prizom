'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, CheckCircle2, AlertCircle, Share2, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { createPromptAction as createStandardPrompt } from '@/app/actions/prompts';

export function StudioPublishPanel() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const router = useRouter();

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePromptText = state.userEdits.promptText || state.aiResponse?.prompt?.main || state.aiResponse?.universalPrompt?.universalMasterPrompt || '';

  const handlePublish = async () => {
    const { title, negativePrompt, category, tags, aspectRatio } = state.userEdits;

    if (!title || title.trim().length < 3) {
      setError('Title must be at least 3 characters long.');
      return;
    }

    if (!activePromptText || activePromptText.trim().length < 10) {
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
        prompt_text: activePromptText.trim(),
        negative_prompt: negativePrompt?.trim() || undefined,
        ai_tool: 'Universal AI Prompt',
        category: category || 'General',
        tags: tags && tags.length > 0 ? tags : ['universal-prompt', 'prizom-studio'],
        image_url: state.uploadedImageUrl || undefined,
        aspect_ratio: aspectRatio || '1:1',
        prompt_type: 'image'
      });

      if (!res.success || !res.data || res.data.length === 0) {
        throw new Error(res.error || 'Failed to publish prompt to Prizom community.');
      }

      const newId = res.data[0].id;
      setPublishedId(newId);
      dispatch({ type: 'PUBLISH_SUCCESS', promptId: newId });

    } catch (err: any) {
      console.error('[STUDIO PUBLISH ERROR]', err);
      setError(err.message || 'An unexpected error occurred while publishing.');
      dispatch({ type: 'SET_ERROR', message: err.message || 'Publishing failed.' });
      setIsPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (!publishedId) return;
    const url = `${window.location.origin}/prompt/${publishedId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Render Publish Success State
  if (publishedId) {
    return (
      <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-white tracking-tight">
            Prompt Successfully Shared!
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed font-medium">
            Your Universal Prompt is now published on Prizom. Creators around the world can view, edit, and recreate this visual concept.
          </p>
        </div>

        {/* Published Card Preview */}
        <div className="max-w-md mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-left space-y-3">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
            {state.uploadedImageUrl && (
              <Image
                src={state.uploadedImageUrl}
                alt="Published prompt artwork"
                fill
                unoptimized
                className="object-cover"
              />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
              {state.userEdits.category || 'General'}
            </span>
            <h4 className="text-sm font-extrabold text-white truncate mt-0.5">
              {state.userEdits.title}
            </h4>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/prompt/${publishedId}`}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <ExternalLink className="w-4 h-4" /> View Published Prompt Page
          </Link>

          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Pre-Publish Review Form
  return (
    <div className="space-y-6">
      {/* Reference Image Guidance Banner */}
      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-medium space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" /> Reference Image vs Public Post Artwork
        </div>
        <p className="leading-relaxed text-zinc-300">
          Your uploaded reference image is used exclusively for AI visual analysis and style reverse-engineering. It is <strong>not automatically set as your public prompt&apos;s final image</strong>.
        </p>
      </div>

      {/* Post Preview Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-300 border-b border-zinc-900 pb-3">
          <Share2 className="w-4 h-4 text-purple-400" />
          <span>Prizom Community Post Share Preview</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Reference Image Badge & Preview */}
          <div className="relative aspect-square w-24 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
            {state.uploadedImageUrl ? (
              <>
                <Image
                  src={state.uploadedImageUrl}
                  alt="Reference image preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  Reference
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] text-zinc-600 font-bold">
                No Preview
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="flex-1 space-y-3 w-full">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Prompt Title
              </label>
              <input
                type="text"
                value={state.userEdits.title}
                onChange={(e) => dispatch({ type: 'EDIT_FIELD', field: 'title', value: e.target.value })}
                placeholder="Give your prompt a title..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-extrabold text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={state.userEdits.category}
                  onChange={(e) => dispatch({ type: 'EDIT_FIELD', field: 'category', value: e.target.value })}
                  placeholder="Photography, Concept Art..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Aspect Ratio
                </label>
                <input
                  type="text"
                  value={state.userEdits.aspectRatio}
                  onChange={(e) => dispatch({ type: 'EDIT_FIELD', field: 'aspectRatio', value: e.target.value })}
                  placeholder="1:1, 16:9..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Universal Prompt Snippet Preview */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 p-3 rounded-xl font-mono text-[11px] text-purple-200 line-clamp-3 leading-relaxed">
          {activePromptText}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-300 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons: Publish or Open Pre-filled in Create Prompt */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing}
          className="flex-1 w-full py-4 px-6 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Publishing Prompt Post...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" /> Publish Prompt Post <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {state.sessionId && (
          <Link
            href={`/create?studioSession=${state.sessionId}`}
            className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-purple-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-purple-400" /> Pre-fill in Create Page
          </Link>
        )}
      </div>
    </div>
  );
}
