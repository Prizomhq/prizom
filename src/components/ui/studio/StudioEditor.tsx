'use client';

import React, { useState, useEffect } from 'react';
import { useStudioState, useStudioDispatch } from './context';
import { StudioConfidenceBadge } from './StudioConfidenceBadge';
import { StudioCompareSlider } from './StudioCompareSlider';
import { StudioPublishPanel } from './StudioPublishPanel';
import { analyzeImageStudioAction } from '@/app/actions/studio';
import { Sparkles, Copy, Check, Camera, Cpu, Code2 } from 'lucide-react';

export function StudioEditor() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>('flux');
  const [copied, setCopied] = useState<boolean>(false);
  const [isProMode, setIsProMode] = useState<boolean>(false);

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

  const compilerTargets = state.aiResponse?.compilerTargets || {};
  const activeTarget = compilerTargets[selectedTargetKey] || {
    modelName: 'Flux 1.1 Pro / Dev',
    promptText: state.userEdits.promptText || state.aiResponse?.prompt.main || '',
    negativePrompt: state.userEdits.negativePrompt || state.aiResponse?.prompt.negative,
    parameters: { guidanceScale: 3.5, steps: 28, aspectRatio: state.userEdits.aspectRatio || '1:1' }
  };

  const handleCopyPrompt = () => {
    if (!activeTarget.promptText) return;
    navigator.clipboard.writeText(activeTarget.promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MODEL_TABS = [
    { key: 'flux', label: 'Flux 1.1 Pro' },
    { key: 'midjourney', label: 'Midjourney v6' },
    { key: 'sdxl', label: 'SDXL / Pony' },
    { key: 'comfyui', label: 'ComfyUI Graph' },
    { key: 'dalle3', label: 'DALL-E 3' },
    { key: 'imagen3', label: 'Google Imagen 3' },
    { key: 'ideogram', label: 'Ideogram v2' },
    { key: 'recraft', label: 'Recraft V3' },
    { key: 'leonardo', label: 'Leonardo' },
    { key: 'firefly', label: 'Adobe Firefly' }
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase">
              14-Stage Vision Pipeline
            </span>
            <span className="text-zinc-500 text-xs font-mono">• Session #{state.sessionId?.substring(0, 8) || 'draft'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            AI Studio Split Canvas Workspace
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-medium mt-1">
            Inspect source upload vs. AST model simulations, fine-tune optical parameters, and export generator prompts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setIsProMode(!isProMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              isProMode 
                ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600'
            }`}
          >
            {isProMode ? 'Pro Mode Active' : 'Enable Pro Mode'}
          </button>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-purple-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Version: v{state.activeVersion}</span>
          </div>
        </div>
      </div>

      {/* Main Split-Canvas Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sourcing, Optics, & Style DNA Badges */}
        <div className={`space-y-5 transition-all duration-500 ${isProMode ? 'lg:col-span-4' : 'lg:col-span-5'}`}>
          {/* Interactive Split-Screen Comparison Component */}
          {state.uploadedImageUrl && (
            <StudioCompareSlider
              originalImageUrl={state.uploadedImageUrl}
              aspectRatio={state.userEdits.aspectRatio || state.aiResponse?.metadata.aspectRatio || '1:1'}
              modelName={activeTarget.modelName}
            />
          )}

          {/* Deep Perception Optics & Volumetric Lighting Breakdown */}
          {isProMode && (
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-5 space-y-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2 text-white font-extrabold text-xs uppercase tracking-wider">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>Reconstructed Optics & Lighting</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                  100% Parsed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">Focal Length</span>
                  <span className="font-extrabold text-purple-300 mt-0.5 block truncate">
                    {state.aiResponse?.optics?.focalLength || '85mm f/1.4 Prime'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">Aperture / Bokeh</span>
                  <span className="font-extrabold text-cyan-300 mt-0.5 block truncate">
                    {state.aiResponse?.optics?.aperture || 'f/1.4 Soft Bokeh'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">Lighting Type</span>
                  <span className="font-extrabold text-amber-300 mt-0.5 block truncate">
                    {state.aiResponse?.lightingDetail?.primaryType || 'Dual Neon Volumetric'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase">Color Temp (K)</span>
                  <span className="font-extrabold text-rose-300 mt-0.5 block truncate">
                    {state.aiResponse?.lightingDetail?.colorTemperature || '6500K Daylight'}
                  </span>
                </div>
              </div>

              {/* Extracted 5-Color HEX Palette Bar */}
              {state.aiResponse?.prompt.colorPalette && (
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Extracted Style Palette (5 Colors)
                  </div>
                  <div className="flex rounded-xl overflow-hidden h-7 border border-zinc-800 shadow-inner">
                    {state.aiResponse.prompt.colorPalette.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex-1 transition-transform hover:scale-110 cursor-pointer relative group"
                        style={{ backgroundColor: color }}
                        title={color}
                        onClick={() => navigator.clipboard.writeText(color)}
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-white bg-black/80 px-1 py-0.5 rounded transition-opacity duration-200">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Model-Aware AST Target Selector & Prompt Editor */}
        <div className={`space-y-5 transition-all duration-500 ${isProMode ? 'lg:col-span-8' : 'lg:col-span-7'}`}>
          {/* Perceptual Accuracy & Safety Confidence Scorecard */}
          {state.aiResponse && (
            <StudioConfidenceBadge
              confidenceScore={state.aiResponse.quality.confidenceScore}
              qualityScore={state.aiResponse.quality.qualityScore}
              safetyScore={state.aiResponse.safety.safetyScore}
              estimatedQuality={state.aiResponse.quality.estimatedOutputQuality}
            />
          )}

          {/* Model-Aware AST Target Tabs */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-black uppercase text-white tracking-wider">
                  Model-Aware AST Prompt Compilers (10 Targets)
                </span>
              </div>

              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy AST Prompt'}</span>
              </button>
            </div>

            {/* Model Target Switcher Bar */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {MODEL_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTargetKey(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedTargetKey === tab.key
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-400/40 scale-105'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Compiled Prompt Output Display */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3 font-mono text-xs text-zinc-200 relative group">
              <div className="flex items-center justify-between text-[10px] font-sans font-bold text-zinc-500 border-b border-zinc-900 pb-2">
                <span>{activeTarget.modelName || 'Flux 1.1 Pro'} Compiled Prompt Syntax</span>
                <span>{activeTarget.promptText?.length || 0} characters</span>
              </div>

              <p className="leading-relaxed text-purple-200 select-all whitespace-pre-wrap">
                {activeTarget.promptText || 'Generating compiled AST prompt...'}
              </p>

              {activeTarget.negativePrompt && (
                <div className="pt-2 border-t border-zinc-900">
                  <span className="text-[10px] font-sans font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    Negative Prompt AST
                  </span>
                  <p className="text-rose-200/80 text-[11px] leading-relaxed">
                    {activeTarget.negativePrompt}
                  </p>
                </div>
              )}

              {/* ComfyUI Node Graph Preview JSON Button */}
              {isProMode && selectedTargetKey === 'comfyui' && activeTarget.comfyuiNodeGraph && (
                <div className="mt-3 p-3 bg-zinc-900 rounded-xl border border-purple-900/50 text-[11px] font-mono text-purple-300 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-purple-400" />
                      ComfyUI KSampler Workflow Graph JSON
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(activeTarget.comfyuiNodeGraph, null, 2))}
                      className="px-2 py-1 rounded bg-purple-950 border border-purple-700/50 text-[10px] font-bold text-purple-200 hover:bg-purple-900"
                    >
                      Copy JSON Graph
                    </button>
                  </div>
                  <pre className="max-h-32 overflow-y-auto text-[10px] text-zinc-400 font-mono">
                    {JSON.stringify(activeTarget.comfyuiNodeGraph, null, 2)}
                  </pre>
                </div>
              )}

              {/* 1-Click External Launch Link */}
              <div className="mt-4 flex justify-end">
                <a 
                  href={state.aiResponse?.intelligence.launchUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline underline-offset-4 transition-all"
                >
                  Launch {activeTarget.modelName} <Sparkles className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Form Editing & Community Publishing Panel */}
          <StudioPublishPanel />
        </div>
      </div>
    </div>
  );
}
