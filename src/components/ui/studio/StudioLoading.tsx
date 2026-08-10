'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Eye, Wand2, Tag, ShieldCheck, Clock } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { analyzeImageStudioAction } from '@/app/actions/studio';

const LOADING_STEPS = [
  { icon: Eye, label: 'Stage 1–4: Scene Graph, Entity Bounding & Spatial Layer Extraction...' },
  { icon: Wand2, label: 'Stage 5–7: Volumetric Lighting Vectors & Camera Optics Simulation...' },
  { icon: Tag, label: 'Stage 8–10: Style Lineage & Multi-Model AST Compiler Generation...' },
  { icon: ShieldCheck, label: 'Stage 11–14: Self-Reflection, Perceptual Similarity & Scorecard Validation...' }
];

export function StudioLoading() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  // Step advancement timer
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, []);

  // Estimated countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0.5 ? Math.round((prev - 0.5) * 10) / 10 : 0.5));
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Execute AG Router vision analysis upon mounting during analyzing step
  useEffect(() => {
    if (state.uploadedImageUrl && !state.aiResponse) {
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
          console.error('[STUDIO LOADING ANALYSIS ERROR]', err);
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
  }, [state.uploadedImageUrl, state.aiResponse, dispatch]);

  const progressPercent = Math.min(95, Math.round(((activeStepIndex + 1) / LOADING_STEPS.length) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center">
        {/* Source Image Thumbnail Preview */}
        {state.uploadedImageUrl ? (
          <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <img
              src={state.uploadedImageUrl}
              alt="Source analysis preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            </div>
          </div>
        ) : (
          /* Animated Icon Glow */
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg text-white">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Estimated Time: ~{secondsRemaining}s</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Deconstructing Visual Perception
        </h2>
        <p className="text-zinc-400 text-sm font-medium mb-6">
          Analyzing composition, camera optics, volumetric lighting, and compiling multi-target prompts.
        </p>

        {/* Visual Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden mb-2 border border-zinc-800">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-zinc-500 font-mono">
            <span>{progressPercent}% Complete</span>
            <span>Step {activeStepIndex + 1} of {LOADING_STEPS.length}</span>
          </div>
        </div>

        {/* Step-by-Step Progress Pipeline */}
        <div className="max-w-md mx-auto space-y-3 mb-10 text-left">
          {LOADING_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 shadow-md'
                    : isDone
                    ? 'text-zinc-300 opacity-90'
                    : 'text-zinc-600 opacity-40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-purple-600 text-white'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-950 text-zinc-600 border border-zinc-800'
                  }`}
                >
                  {isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Stream Field Skeleton Reveal */}
        {state.streamingField && (
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-left animate-in fade-in duration-200">
            <div className="text-[10px] font-black uppercase text-purple-400 tracking-wider mb-1 font-mono">
              Streaming Field Token: {state.streamingField}
            </div>
            <div className="text-xs font-mono text-zinc-300 truncate">
              {state.userEdits[state.streamingField as keyof typeof state.userEdits] || 'Populating...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
