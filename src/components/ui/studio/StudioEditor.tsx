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
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <PrizomAIStudioLogo size="md" showBadge={true} />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET_FLOW' })}
            className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Generation</span>
          </button>

          <button
            type="button"
            onClick={handlePublishToPrizom}
            disabled={isPublishing}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'Publishing...' : 'Share to Prizom'}</span>
          </button>
        </div>
      </div>

      {publishMessage && (
        <div className="p-4 bg-purple-950/60 border border-purple-800/60 rounded-2xl text-purple-300 text-xs font-bold text-center animate-in fade-in">
          {publishMessage}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Source Image & Technical Aspect Ratio Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 shadow-xl backdrop-blur-xl">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-400" /> Source Reference Image
            </h3>

            {state.uploadedImageUrl ? (
              <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 aspect-square">
                <img
                  src={state.uploadedImageUrl}
                  alt="Uploaded source"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            {/* Technical Metadata Details Card */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Dimensions:</span>
                <span className="text-white font-bold">{state.sourceWidth || 1024} × {state.sourceHeight || 1024} px</span>
              </div>

              <div className="flex justify-between items-center text-zinc-400">
                <span>Detected Ratio:</span>
                <span className="text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-950 border border-purple-800/50">
                  {state.aspectRatioDetails?.normalized_aspect_ratio || state.userEdits.aspectRatio || '1:1'}
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-400">
                <span>Orientation:</span>
                <span className="text-white capitalize font-bold">{state.aspectRatioDetails?.orientation || 'square'}</span>
              </div>

              <div className="flex justify-between items-center text-zinc-400">
                <span>Ratio Confidence:</span>
                <span className="text-emerald-400 font-bold">{Math.round((state.aspectRatioDetails?.confidence || 0.95) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Intelligence Scorecard */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <PrizomAIStudioMark size={14} /> Quality Scorecard
            </h3>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="text-xl font-black text-purple-400 font-mono">
                  {Math.round((state.aiResponse?.quality?.qualityScore || 0.95) * 100)}%
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">Quality Grade</div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="text-xl font-black text-emerald-400 font-mono">
                  {Math.round((state.aiResponse?.quality?.confidenceScore || 0.96) * 100)}%
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">Grounding Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Universal Prompt Viewer & Controls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('universal')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'universal'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Universal Master Spec
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('variables')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'variables'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Editable Variables ({editableVars.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('targets')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'targets'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Model Targets
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-4 py-2 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-700/50 text-purple-300 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>
            </div>

            {/* TAB CONTENT: Universal Master Spec */}
            {activeTab === 'universal' && (
              <div className="space-y-4">
                <div className="relative bg-zinc-950 rounded-2xl p-5 border border-zinc-800 text-zinc-100 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-y-auto selection:bg-purple-600 shadow-inner">
                  {mainPromptText}
                </div>

                {/* Editable Title input */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-1">
                    Spec Title
                  </label>
                  <input
                    type="text"
                    value={state.userEdits.title}
                    onChange={(e) => dispatch({ type: 'EDIT_FIELD', field: 'title', value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-bold focus:outline-none focus:border-purple-500"
                    placeholder="Enter prompt spec title..."
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: Editable Variables */}
            {activeTab === 'variables' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 font-medium">
                  The Universal Engine extracted these fixed and editable variable slots for prompt customization:
                </p>

                {editableVars.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editableVars.map((v, idx) => (
                      <div key={idx} className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-400 uppercase">
                          <span>[{v.key}]</span>
                          <span className="text-zinc-500">{v.category}</span>
                        </div>
                        <div className="text-xs font-bold text-white truncate">{v.currentValue}</div>
                        <div className="text-[11px] text-zinc-500">{v.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 text-center text-xs text-zinc-500">
                    No custom variables extracted for this simple image spec.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Model Targets */}
            {activeTab === 'targets' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(compilerTargets).map(([targetKey, targetObj]: [string, any]) => (
                    <div key={targetKey} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-300 uppercase font-mono">
                        <span>{targetObj.target || targetKey}</span>
                        <span className="text-[10px] text-zinc-500">{targetObj.modelName}</span>
                      </div>
                      <div className="text-xs font-mono text-zinc-400 line-clamp-3 leading-relaxed">
                        {targetObj.promptText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Section Dropdown */}
            <div className="pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-extrabold text-zinc-400 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" /> Advanced Markdown Specification
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap max-h-72 overflow-y-auto animate-in fade-in">
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
