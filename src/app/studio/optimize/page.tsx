'use client';

import React, { useState } from 'react';
import { StudioSubNav } from '@/components/ui/studio/StudioSubNav';
import { Wand2, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { compileAllTargets } from '@/lib/ai-studio/compiler';

export default function StudioOptimizePage() {
  const [inputPrompt, setInputPrompt] = useState(
    'A cyberpunk girl standing in a rainy city street at night, neon lights, glowing cyan and magenta reflections, photorealistic 8k'
  );
  const [targetModel, setTargetModel] = useState<string>('flux');
  const [copied, setCopied] = useState(false);

  const mockResponseData = {
    prompt: {
      main: inputPrompt,
      negative: 'low quality, blurry, noise, distortion, oversaturated, draft',
      style: 'cyberpunk night street art',
      lighting: 'dual-tone neon volumetric lighting',
      composition: 'medium wide street shot',
      camera: '35mm anamorphic prime lens, f/1.8',
      colorPalette: ['#A855F7', '#06B6D4', '#0F172A', '#1E293B', '#F43F5E'],
      mood: 'dramatic urban atmosphere'
    },
    optics: {
      focalLength: '35mm anamorphic prime',
      aperture: 'f/1.8',
      shotType: 'Medium environmental street shot',
      cameraAngle: 'Eye-level angle',
      depthOfField: 'Anamorphic shallow depth of field',
      lensCharacter: 'Horizontal oval bokeh flares'
    },
    metadata: { aspectRatio: '16:9' }
  };

  const compiledTargets = compileAllTargets(mockResponseData as any);
  const currentCompiled = compiledTargets[targetModel] || compiledTargets.flux;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCompiled.promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      <StudioSubNav creditBalance={10} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                AST Model AST Transformer & Optimizer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Prompt AST Optimizer
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium mt-1">
              Transform generic prompt strings into production-grade model-optimized ASTs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-black uppercase text-white tracking-wider">
                Raw Input Prompt
              </span>
              <span className="text-[10px] text-zinc-500 font-bold">
                {inputPrompt.length} chars
              </span>
            </div>

            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              rows={8}
              placeholder="Paste any prompt here to optimize..."
              className="w-full p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
            />

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider block">
                Target Model Optimization Architecture
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'flux', label: 'Flux 1.1 Pro' },
                  { key: 'midjourney', label: 'Midjourney v6' },
                  { key: 'sdxl', label: 'SDXL / Pony' },
                  { key: 'comfyui', label: 'ComfyUI' },
                  { key: 'dalle3', label: 'DALL-E 3' },
                  { key: 'imagen3', label: 'Imagen 3' }
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setTargetModel(m.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      targetModel === m.key
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-7 bg-zinc-900 border border-purple-900/50 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                  {currentCompiled.modelName} Optimized AST Prompt
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy AST Prompt'}</span>
              </button>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 font-mono text-xs text-purple-200 leading-relaxed whitespace-pre-wrap">
              {currentCompiled.promptText}
            </div>

            {currentCompiled.negativePrompt && (
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-[10px] font-sans font-bold text-rose-400 uppercase tracking-wider block">
                  Optimized Negative Prompt
                </span>
                <p className="text-rose-200/80 font-mono text-xs leading-relaxed">
                  {currentCompiled.negativePrompt}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
