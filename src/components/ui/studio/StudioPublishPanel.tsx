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

  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [activeTargetTab, setActiveTargetTab] = useState<'flux' | 'midjourney' | 'sdxl' | 'comfyui'>('midjourney');

  const compilerTargets = state.aiResponse?.compilerTargets;

  const handleCopyTarget = (targetKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTarget(targetKey);
    setTimeout(() => setCopiedTarget(null), 2500);
  };

  const handleDownloadComfyUI = (graph: any) => {
    const jsonStr = JSON.stringify(graph, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prizom_comfyui_workflow_${state.sessionId || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const styleDNA = state.aiResponse?.styleDNA;
  const characterIdentity = state.aiResponse?.characterIdentity;
  const autonomousRefinement = state.aiResponse?.autonomousRefinement;

  return (
    <div className="space-y-6 mt-6">
      {/* Autonomous Engine Certification Seal Banner */}
      {autonomousRefinement && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-purple-950/80 border border-emerald-500/30 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                ✓ {autonomousRefinement.certified ? 'Certified High-Fidelity' : 'Self-Refined'}
              </span>
              <span className="text-xs font-bold text-zinc-400">Score: {autonomousRefinement.refinedScore}/100</span>
            </div>
            <h4 className="text-base font-extrabold text-white mt-1">{autonomousRefinement.certificationBadge}</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Refinement Iterations: {autonomousRefinement.iterationsRun} • S_CLIP: {autonomousRefinement.simulatedMetrics.clipAlignmentScore} • LPIPS Dist: {autonomousRefinement.simulatedMetrics.lpipsDistance}
            </p>
          </div>

          <div className="text-right text-[11px] font-mono text-emerald-400 bg-zinc-950/80 p-2.5 rounded-2xl border border-zinc-800 shrink-0">
            <div>SSIM Layout: {(autonomousRefinement.simulatedMetrics.ssimLayoutScore * 100).toFixed(0)}%</div>
            <div className="text-purple-300 font-sans font-bold">API v2.0 Enterprise</div>
          </div>
        </div>
      )}

      {/* Style DNA & Character Identity Anchors */}
      {(styleDNA || characterIdentity) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Style DNA Card */}
          {styleDNA && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-white">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                Style DNA Analysis
              </span>
              <h5 className="text-sm font-extrabold text-white mt-1.5">{styleDNA.medium}</h5>
              <p className="text-[11px] font-semibold text-zinc-400 mb-3">{styleDNA.movement}</p>
              
              <div className="space-y-1.5 text-[11px] font-medium text-zinc-300 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/60">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Color Temperature:</span>
                  <span className="font-bold text-amber-300">{styleDNA.colorTemperatureKelvin}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Contrast Ratio:</span>
                  <span className="font-bold text-emerald-400">{styleDNA.contrastRatio}:1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Shading Type:</span>
                  <span className="font-bold text-purple-300 truncate">{styleDNA.shadingType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Character Identity Anchor Card */}
          {characterIdentity && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-white">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                Character Identity Anchor
              </span>
              <h5 className="text-sm font-extrabold text-white mt-1.5">
                {characterIdentity.hasSubject ? characterIdentity.subjectType.replace('_', ' ').toUpperCase() : 'Non-Subject Scene'}
              </h5>
              <p className="text-[11px] font-semibold text-zinc-400 mb-3">
                {characterIdentity.hasSubject ? `ID Vector: ${characterIdentity.identityVectorId}` : 'Environment Scene'}
              </p>

              {characterIdentity.hasSubject && (
                <div className="space-y-1 text-[11px] font-medium text-zinc-300 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/60">
                  <div><span className="text-zinc-500">Demographics:</span> <strong className="text-indigo-300">{characterIdentity.ageGroup} {characterIdentity.genderPresentation}</strong></div>
                  <div><span className="text-zinc-500">Hair:</span> {characterIdentity.hairDescriptor}</div>
                  <div><span className="text-zinc-500">Garment:</span> {characterIdentity.garmentDescriptor}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Target Generator AST Compiler Panel */}
      {compilerTargets && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-lg text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-950/80 px-2.5 py-1 rounded border border-purple-800/40">
                Prizom AST Prompt Compiler
              </span>
              <h4 className="text-base font-extrabold text-white mt-1">Cross-Model Target Exports</h4>
            </div>

            {/* Target Model Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-full border border-zinc-800 overflow-x-auto">
              {(['midjourney', 'flux', 'sdxl', 'comfyui', 'dalle3', 'video'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTargetTab(t as any)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer capitalize ${
                    activeTargetTab === t
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Target Content Display */}
          {compilerTargets[activeTargetTab] && (
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Model: <strong className="text-purple-300">{compilerTargets[activeTargetTab].modelName}</strong></span>
                {activeTargetTab === 'comfyui' ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadComfyUI(compilerTargets[activeTargetTab].comfyuiNodeGraph)}
                    className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full cursor-pointer transition-all"
                  >
                    ↓ Download Node Graph JSON
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCopyTarget(activeTargetTab, compilerTargets[activeTargetTab].promptText)}
                    className="text-[11px] font-black text-purple-400 hover:text-purple-300 bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-full cursor-pointer transition-all"
                  >
                    {copiedTarget === activeTargetTab ? '✓ Copied Target!' : 'Copy Target Prompt'}
                  </button>
                )}
              </div>

              <div className="bg-zinc-900 p-3 rounded-xl font-mono text-xs text-zinc-200 break-words leading-relaxed border border-zinc-800">
                {compilerTargets[activeTargetTab].promptText}
              </div>

              {compilerTargets[activeTargetTab].negativePrompt && (
                <div className="text-[11px] font-semibold text-zinc-400">
                  <span className="text-zinc-500 uppercase font-black text-[9px] block mb-0.5">Negative Prompt:</span>
                  <span className="font-mono text-zinc-300">{compilerTargets[activeTargetTab].negativePrompt}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
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
    </div>
  );
}
