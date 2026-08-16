'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2, Bookmark, RefreshCw, Sliders, ChevronDown, ChevronUp, Info, Layers, Eye, Camera, Palette, Box } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { PrizomAIStudioLogo, PrizomAIStudioMark } from '@/components/ui/PrizomAIStudioMark';
import { createPromptAction } from '@/app/actions/prompts';
import { useRouter } from 'next/navigation';

export function StudioEditor() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'universal' | 'sections' | 'variables' | 'targets'>('universal');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const mainPromptText = state.userEdits.promptText || state.aiResponse?.prompt?.main || '';
  const markdownSpec = state.aiResponse?.universalPrompt?.fullMarkdownPrompt || mainPromptText;
  const editableVars = state.aiResponse?.prompt?.editableVariables || [];
  const compilerTargets = state.aiResponse?.compilerTargets || {};

  const handleCopyPrompt = () => {
    if (!mainPromptText) return;
    navigator.clipboard.writeText(mainPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePublishToPrizom = async () => {
    if (!mainPromptText || isPublishing) return;
    setIsPublishing(true);
    setPublishMessage(null);

    try {
      const res = await createPromptAction({
        title: state.userEdits.title || 'Reconstructed Visual Spec',
        prompt_text: mainPromptText,
        negative_prompt: state.userEdits.negativePrompt || undefined,
        ai_tool: state.userEdits.aiTool || 'Flux',
        category: state.userEdits.category || 'Photography',
        tags: [...(state.userEdits.tags || []), 'prizom-ai-studio'],
        image_url: state.uploadedImageUrl || undefined,
        image_width: state.sourceWidth || undefined,
        image_height: state.sourceHeight || undefined,
        aspect_ratio: state.userEdits.aspectRatio || '1:1'
      });

      if (res.success && res.data?.[0]?.id) {
        setPublishMessage('✓ Published to Prizom! Redirecting...');
        dispatch({ type: 'PUBLISH_SUCCESS', promptId: res.data[0].id });
        setTimeout(() => {
          router.push(`/prompt/${res.data[0].id}`);
        }, 1200);
      } else {
        setPublishMessage(res.error || 'Failed to publish prompt.');
      }
    } catch (err: any) {
      setPublishMessage(err.message || 'Error publishing prompt.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <PrizomAIStudioLogo size="md" showBadge={true} />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET_FLOW' })}
            className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>New Generation</span>
          </button>

          <button
            type="button"
            onClick={handlePublishToPrizom}
            disabled={isPublishing}
            className="px-6 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>{isPublishing ? 'Publishing...' : 'Share to Prizom'}</span>
          </button>
        </div>
      </div>

      {publishMessage && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900 text-xs font-bold text-center animate-in fade-in shadow-sm">
          {publishMessage}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Source Image & Key Visual Breakdown */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-4 shadow-sm glass-card">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" /> Source Image
            </h3>

            {state.uploadedImageUrl ? (
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square shadow-inner">
                <img
                  src={state.uploadedImageUrl}
                  alt="Uploaded source"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            {/* Visual Attributes Breakdown Pills */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-600">
                <span>Dimensions:</span>
                <span className="text-slate-900 font-bold">{state.sourceWidth || 1024} × {state.sourceHeight || 1024} px</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Aspect Ratio:</span>
                <span className="text-indigo-700 font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200/60">
                  {state.aspectRatioDetails?.normalized_aspect_ratio || state.userEdits.aspectRatio || '1:1'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Orientation:</span>
                <span className="text-slate-900 capitalize font-bold">{state.aspectRatioDetails?.orientation || 'square'}</span>
              </div>
            </div>
          </div>

          {/* Prompt Confidence & Quality Scorecard */}
          <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-5 shadow-sm glass-card space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <PrizomAIStudioMark size={14} /> Analysis Scorecard
            </h3>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <div className="text-xl font-black text-indigo-700 font-mono">
                  {Math.round((state.aiResponse?.quality?.qualityScore || 0.95) * 100)}%
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Prompt Quality</div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="text-xl font-black text-emerald-700 font-mono">
                  {Math.round((state.aiResponse?.quality?.confidenceScore || 0.96) * 100)}%
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Confidence</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Universal Prompt Result */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 shadow-sm glass-card space-y-6">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('universal')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'universal'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Generated Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('variables')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'variables'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prompt Variables ({editableVars.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('targets')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'targets'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Model Formats
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-4 py-2 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>
            </div>

            {/* TAB CONTENT: Generated Prompt Reading Surface */}
            {activeTab === 'universal' && (
              <div className="space-y-4">
                <div className="relative bg-slate-50/90 rounded-2xl p-5 border border-slate-200/80 text-slate-900 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-y-auto selection:bg-indigo-600 selection:text-white shadow-inner">
                  {mainPromptText}
                </div>

                {/* Editable Title input */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                    Prompt Title
                  </label>
                  <input
                    type="text"
                    value={state.userEdits.title}
                    onChange={(e) => dispatch({ type: 'EDIT_FIELD', field: 'title', value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="Enter prompt title..."
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: Prompt Variables */}
            {activeTab === 'variables' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  Variable parameters extracted from the visual artwork:
                </p>

                {editableVars.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editableVars.map((v, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-indigo-600 uppercase">
                          <span>[{v.key}]</span>
                          <span className="text-slate-400">{v.category}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate">{v.currentValue}</div>
                        <div className="text-[11px] text-slate-500">{v.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-500">
                    No custom variables extracted for this image.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Model Formats */}
            {activeTab === 'targets' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(compilerTargets).map(([targetKey, targetObj]: [string, any]) => (
                    <div key={targetKey} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-700 uppercase font-mono">
                        <span>{targetObj.target || targetKey}</span>
                        <span className="text-[10px] text-slate-500">{targetObj.modelName}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-600 line-clamp-3 leading-relaxed">
                        {targetObj.promptText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progressive Disclosure: Advanced Markdown Specification Accordion */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-black text-slate-500 hover:text-slate-900 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Advanced Specification Details
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-72 overflow-y-auto animate-in fade-in">
                  {markdownSpec}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

