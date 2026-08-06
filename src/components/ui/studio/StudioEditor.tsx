'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useStudioState, useStudioDispatch } from './context';
import { StudioPublishPanel } from './StudioPublishPanel';
import { analyzeImageStudioAction } from '@/app/actions/studio';
import { Sparkles, Copy, Check, ArrowLeft, Share2, X } from 'lucide-react';

export function StudioEditor() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const [copied, setCopied] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

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

  const activePromptText = (state.aiResponse?.prompt.main || state.userEdits.promptText || '').trim();
  const aspectRatio = state.userEdits.aspectRatio || state.aiResponse?.metadata.aspectRatio || '1:1';

  const handleCopyPrompt = () => {
    if (!activePromptText) return;
    navigator.clipboard.writeText(activePromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_FLOW' });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* V1 Streamlined 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel (1/3 width: 4 cols out of 12) */}
        <div className="lg:col-span-4 space-y-5 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
          {/* Uploaded Image Preview */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 group">
            {state.uploadedImageUrl ? (
              <Image
                src={state.uploadedImageUrl}
                alt="Uploaded source"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-xs font-bold">
                No Image Loaded
              </div>
            )}

            {/* Aspect Ratio Badge */}
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-purple-500/40 text-purple-300 text-xs font-black tracking-wide shadow-md">
              {aspectRatio}
            </div>
          </div>

          {/* Reset / Create Another CTA Button */}
          <button
            onClick={handleReset}
            className="w-full py-3 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>← Create Another</span>
          </button>
        </div>

        {/* Right Panel (2/3 width: 8 cols out of 12) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Header / Title */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-purple-300">
                    Generated Production Prompt
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                  {state.aiResponse?.metadata.title || 'AI Image Prompt Result'}
                </h2>
              </div>

              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
                Ready
              </span>
            </div>

            {/* Clean Prompt Container Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Prompt Text
              </label>
              <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800/90 text-sm font-mono text-purple-200 leading-relaxed select-all whitespace-pre-wrap min-h-[140px] focus-within:border-purple-500/60 transition-colors shadow-inner">
                {activePromptText || 'Generating production prompt...'}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              {/* Copy Prompt Button */}
              <button
                onClick={handleCopyPrompt}
                disabled={!activePromptText}
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>

              {/* Share Card Button */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>Share Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Card Modal Overlay */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-400" /> Share & Publish Prompt
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <StudioPublishPanel />
          </div>
        </div>
      )}
    </div>
  );
}
