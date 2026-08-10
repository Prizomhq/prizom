'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useStudioState, useStudioDispatch } from './context';
import { StudioPublishPanel } from './StudioPublishPanel';
import { analyzeImageStudioAction } from '@/app/actions/studio';
import { Sparkles, Copy, Check, ArrowLeft, Share2, X, Download } from 'lucide-react';

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

  const [selectedTargetKey, setSelectedTargetKey] = useState<string>('flux');

  const TARGET_MODELS = [
    { id: 'flux', name: 'Flux 1.1 Pro' },
    { id: 'midjourney', name: 'Midjourney v6.1' },
    { id: 'sdxl', name: 'SDXL 1.0' },
    { id: 'comfyui', name: 'ComfyUI Graph' },
    { id: 'dalle3', name: 'DALL-E 3' }
  ];

  const targetOutput = state.aiResponse?.compilerTargets?.[selectedTargetKey];
  const activePromptText = (
    targetOutput?.promptText ||
    state.aiResponse?.prompt.main ||
    ''
  ).trim();

  const displayedPromptText = state.userEdits.promptText || activePromptText;
  const aspectRatio = state.userEdits.aspectRatio || state.aiResponse?.metadata.aspectRatio || '1:1';

  const handleDownloadComfyUI = () => {
    const jsonStr = JSON.stringify(targetOutput?.parameters || { nodes: [] }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prizom-comfyui-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = () => {
    if (!activePromptText) return;
    navigator.clipboard.writeText(activePromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_FLOW' });
  };

  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state.aiResponse?.prompt.variables) {
      setCustomVariables(state.aiResponse.prompt.variables);
    }
  }, [state.aiResponse]);

  const handleVariableChange = (key: string, val: string) => {
    const updated = { ...customVariables, [key]: val };
    setCustomVariables(updated);

    let template = state.aiResponse?.prompt.template || state.aiResponse?.prompt.main || '';
    Object.entries(updated).forEach(([k, v]) => {
      template = template.replaceAll(`{${k}}`, v);
    });

    dispatch({
      type: 'EDIT_FIELD',
      field: 'promptText',
      value: template
    });
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
              Aspect Ratio: {aspectRatio}
            </div>
          </div>

          {/* Typography / Detected Text Details if available */}
          {state.aiResponse?.typography?.hasText && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                <span>Detected Typography</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-800">
                  {state.aiResponse.typography.fontStyle}
                </span>
              </div>
              <div className="text-xs text-zinc-300 font-mono bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                {state.aiResponse.typography.detectedText.join(', ') || 'Text visible'}
              </div>
            </div>
          )}

          {/* Reference Image Guidance Card */}
          {state.aiResponse?.prompt.referenceGuide && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Composition Reference Guide
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                {state.aiResponse.prompt.referenceGuide}
              </p>
            </div>
          )}

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

            {/* Editable Variables System */}
            {state.aiResponse?.prompt.editableVariables && state.aiResponse.prompt.editableVariables.length > 0 && (
              <div className="space-y-3 bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                    Editable Prompt Variables
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Change variables to auto-update prompt text
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {state.aiResponse.prompt.editableVariables.map((variable) => (
                    <div key={variable.key} className="space-y-1">
                      <span className="text-[11px] font-mono text-zinc-400 font-bold block">
                        {`{${variable.key}}`}
                      </span>
                      <input
                        type="text"
                        value={customVariables[variable.key] || variable.currentValue}
                        onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Photograph AI Perception Guidance Banner */}
            {state.aiResponse?.aiDetection?.isRealPhotograph && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-medium space-y-1 animate-in fade-in">
                <div className="font-bold flex items-center gap-1.5 text-amber-200">
                  📷 Camera Photograph Perception Mode
                </div>
                <p className="leading-relaxed text-amber-300/90">
                  {state.aiResponse.aiDetection.userGuidanceMessage}
                </p>
              </div>
            )}

            {/* Model Target Compiler Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Target AI Model Compiler
                </label>
                <span className="text-[10px] text-purple-400 font-mono">
                  Compiled AST Prompt Syntax
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {TARGET_MODELS.map((model) => {
                  const isSelected = selectedTargetKey === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setSelectedTargetKey(model.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shrink-0 border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {model.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Prompt Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  {TARGET_MODELS.find(m => m.id === selectedTargetKey)?.name || 'Target'} Prompt (Editable)
                </label>
                <span className="text-[10px] text-purple-400 font-mono">
                  Direct edit or variable sync enabled
                </span>
              </div>
              <textarea
                rows={5}
                value={displayedPromptText}
                onChange={(e) => dispatch({ type: 'EDIT_FIELD', field: 'promptText', value: e.target.value })}
                placeholder="Generating production prompt..."
                className="w-full p-5 bg-zinc-950 rounded-2xl border border-zinc-800/90 text-sm font-mono text-purple-200 leading-relaxed focus:outline-none focus:border-purple-500/80 transition-colors shadow-inner resize-y min-h-[140px]"
              />
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
                <span>{copied ? 'Copied to Clipboard!' : `Copy ${TARGET_MODELS.find(m => m.id === selectedTargetKey)?.name || 'Model'} Prompt`}</span>
              </button>

              {/* ComfyUI Download Button if active */}
              {selectedTargetKey === 'comfyui' && (
                <button
                  onClick={handleDownloadComfyUI}
                  className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Workflow JSON</span>
                </button>
              )}

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
