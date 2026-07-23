'use client';

import React, { useEffect } from 'react';
import { useStudioState, useStudioDispatch } from './context';
import { StudioConfidenceBadge } from './StudioConfidenceBadge';
import { StudioFieldCard } from './StudioFieldCard';
import { StudioPublishPanel } from './StudioPublishPanel';
import { analyzeImageStudioAction } from '@/app/actions/studio';

export function StudioEditor() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();

  // Execute AG Router Analysis when state reaches 'analyzing'
  useEffect(() => {
    if (state.step === 'analyzing' && state.uploadedImageUrl && !state.aiResponse) {
      let isMounted = true;

      const runAnalysis = async () => {
        try {
          const res = await analyzeImageStudioAction(state.uploadedImageUrl!);
          if (!res.success || !res.response) {
            throw new Error(res.error || 'Analysis failed.');
          }
          if (isMounted) {
            dispatch({ type: 'SET_RESPONSE', response: res.response });
          }
        } catch (err: any) {
          console.error('[STUDIO EDITOR ANALYSIS ERROR]', err);
          if (isMounted) {
            dispatch({ type: 'SET_ERROR', message: err.message || 'Analysis failed.' });
          }
        }
      };

      runAnalysis();

      return () => {
        isMounted = false;
      };
    }
  }, [state.step, state.uploadedImageUrl, state.aiResponse, dispatch]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Workspace Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            AI Studio Workspace
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-1">
            Review and fine-tune AG Router&apos;s generated prompt template before publishing to the community.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 shrink-0">
          <span>Active Version: v{state.activeVersion}</span>
        </div>
      </div>

      {/* Two-Column Responsive Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Persistent Image Preview (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 px-1">
              Source Image Preview
            </div>
            
            {state.uploadedImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-950 aspect-square group shadow-inner">
                <img
                  src={state.uploadedImageUrl}
                  alt="Studio Upload Draft"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs font-medium">
                No preview available
              </div>
            )}

            <div className="mt-4 p-3 bg-zinc-50 rounded-xl text-[11px] font-semibold text-zinc-500 flex items-center justify-between">
              <span>Target Aspect Ratio</span>
              <span className="font-bold text-zinc-900">{state.userEdits.aspectRatio || '1:1'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Parameter Fields (8 cols) */}
        <div className="lg:col-span-8">
          {/* Quality & Safety Confidence Metrics */}
          {state.aiResponse && (
            <StudioConfidenceBadge
              confidenceScore={state.aiResponse.quality.confidenceScore}
              qualityScore={state.aiResponse.quality.qualityScore}
              safetyScore={state.aiResponse.safety.safetyScore}
              estimatedQuality={state.aiResponse.quality.estimatedOutputQuality}
            />
          )}

          {/* Form Parameter Fields */}
          <div className="space-y-4">
            <StudioFieldCard
              fieldKey="title"
              label="SEO Title"
              placeholder="e.g., Futuristic Neon Security Hub"
              maxLength={100}
              required
            />

            <StudioFieldCard
              fieldKey="promptText"
              label="Main Prompt Text"
              placeholder="Describe the complete visual scene..."
              type="textarea"
              maxLength={2000}
              required
            />

            <StudioFieldCard
              fieldKey="negativePrompt"
              label="Negative Prompt"
              placeholder="Elements to exclude..."
              type="textarea"
              maxLength={500}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StudioFieldCard
                fieldKey="category"
                label="Category"
                placeholder="e.g., Concept Art"
                maxLength={50}
                required
              />

              <StudioFieldCard
                fieldKey="aiTool"
                label="Target AI Tool"
                placeholder="e.g., Midjourney, Flux"
                maxLength={50}
                required
              />
            </div>

            <StudioFieldCard
              fieldKey="tags"
              label="Tags (Comma Separated)"
              placeholder="cyberpunk, neon, futuristic"
              type="tags"
              maxLength={200}
            />
          </div>

          {/* Publish Action Panel */}
          <StudioPublishPanel />
        </div>
      </div>
    </div>
  );
}
