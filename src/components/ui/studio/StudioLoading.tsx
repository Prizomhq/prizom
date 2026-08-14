'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Eye, Wand2, Tag, ShieldCheck, Clock, Layers, Camera } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { analyzeImageStudioAction, completeStudioSessionAction, refundFailedGenerationAction } from '@/app/actions/studio';
import { PrizomAIStudioMark } from '@/components/ui/PrizomAIStudioMark';

const LOADING_STEPS = [
  { icon: Eye, label: 'Stage 1–2: Global Scene Perception & Primary Subject Identification' },
  { icon: Layers, label: 'Stage 3–4: Composition Framing, Depth Layers & Spatial Hierarchy' },
  { icon: Camera, label: 'Stage 5–6: Calibrated Camera Optics, Aperture & Lighting Analysis' },
  { icon: Wand2, label: 'Stage 7–8: Color Palette Extraction & Material Surface Shaders' },
  { icon: Tag, label: 'Stage 9–10: Typography Preservation & Visual Style Lineage' },
  { icon: ShieldCheck, label: 'Stage 11: Universal Master Prompt AST Recipe Compilation' }
];

export function StudioLoading() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0.5 ? Math.round((prev - 0.5) * 10) / 10 : 0.5));
    }, 500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (state.uploadedImageUrl && !state.aiResponse) {
      let isMounted = true;

      const runAnalysis = async () => {
        try {
          const res = await analyzeImageStudioAction(state.uploadedImageUrl!, {
            quality: 'premium',
            sourceDimensions: (state.sourceWidth && state.sourceHeight)
              ? { width: state.sourceWidth, height: state.sourceHeight }
              : undefined
          });

          if (!res.success || !res.response) {
            throw new Error(res.error || 'AI image perception analysis failed.');
          }

          if (isMounted) {
            dispatch({ type: 'SET_RESPONSE', response: res.response });

            if (state.sessionId) {
              try {
                await completeStudioSessionAction(
                  state.sessionId,
                  1,
                  res.response.prompt.main,
                  res.response.prompt.negative || null,
                  res.response
                );
              } catch (pErr) {
                console.warn('[STUDIO PERSISTENCE WARN]', pErr);
              }
            }
          }
        } catch (err: any) {
          console.error('[STUDIO LOADING ANALYSIS ERROR]', err);

          if (state.sessionId) {
            try {
              const refundRes = await refundFailedGenerationAction(state.sessionId, err.message);
              if (refundRes.success && typeof refundRes.balanceAfter === 'number' && isMounted) {
                dispatch({
                  type: 'SET_ERROR',
                  message: `${err.message || 'Generation failed.'} Your 1 generation credit has been refunded.`
                });
                return;
              }
            } catch (rErr) {
              console.warn('[STUDIO REFUND WARN]', rErr);
            }
          }

          if (isMounted) {
            dispatch({ type: 'SET_ERROR', message: err.message || 'Analysis failed. Please try again.' });
          }
        }
      };

      runAnalysis();

      return () => {
        isMounted = false;
      };
    }
  }, [state.uploadedImageUrl, state.aiResponse, state.sessionId, state.sourceWidth, state.sourceHeight, dispatch]);

  const progressPercent = Math.min(95, Math.round(((activeStepIndex + 1) / LOADING_STEPS.length) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center">
        {state.uploadedImageUrl ? (
          <div className="relative w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <img
              src={state.uploadedImageUrl}
              alt="Source analysis preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1.5">
              <PrizomAIStudioMark size={20} className="animate-spin" />
            </div>
          </div>
        ) : (
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-lg">
              <PrizomAIStudioMark size={40} className="animate-spin" />
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
          Executing 11-stage visual perception analysis and compiling universal prompt spec.
        </p>

        {/* Visual Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden mb-2 border border-zinc-800">
            <div
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-zinc-500 font-mono">
            <span>{progressPercent}% Complete</span>
            <span>Step {activeStepIndex + 1} of {LOADING_STEPS.length}</span>
          </div>
        </div>

        {/* Step Progress Pipeline */}
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
      </div>
    </div>
  );
}
