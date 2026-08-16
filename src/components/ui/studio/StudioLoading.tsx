'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Eye, Wand2, Tag, ShieldCheck, Clock, Layers, Camera } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { analyzeImageStudioAction, completeStudioSessionAction, refundFailedGenerationAction } from '@/app/actions/studio';
import { PrizomAIStudioMark } from '@/components/ui/PrizomAIStudioMark';

const LOADING_STEPS = [
  { icon: Eye, label: 'Analyzing image composition & main subject' },
  { icon: Camera, label: 'Extracting environment, lighting & camera optics' },
  { icon: Wand2, label: 'Identifying visual style, color palette & details' },
  { icon: ShieldCheck, label: 'Building your universal prompt' }
];

export function StudioLoading() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 700);

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
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl backdrop-blur-xl text-center glass-card">
        {state.uploadedImageUrl ? (
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-md">
            <img
              src={state.uploadedImageUrl}
              alt="Analyzing uploaded artwork"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
              <PrizomAIStudioMark size={28} className="animate-spin text-white" />
            </div>
          </div>
        ) : (
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <PrizomAIStudioMark size={32} className="animate-spin" />
            </div>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-xs font-bold mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Estimated processing time: ~{secondsRemaining}s</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Analyzing Image Elements
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm font-medium mb-6 max-w-md mx-auto">
          Prizom is extracting subject, composition, lighting, camera settings, and style attributes to reconstruct your prompt.
        </p>

        {/* Visual Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2 border border-slate-200/60">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono font-bold text-slate-500">
            <span>{progressPercent}% completed</span>
            <span>Step {activeStepIndex + 1} of {LOADING_STEPS.length}</span>
          </div>
        </div>

        {/* Step Progress Pipeline */}
        <div className="max-w-md mx-auto space-y-2.5 text-left">
          {LOADING_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-900 shadow-sm'
                    : isDone
                    ? 'text-slate-700 opacity-90'
                    : 'text-slate-400 opacity-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-xs font-bold">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

