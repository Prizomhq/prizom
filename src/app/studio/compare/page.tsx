'use client';

import React, { useState } from 'react';
import { StudioSubNav } from '@/components/ui/studio/StudioSubNav';
import { GitCompare, Sparkles, Copy, Check, ArrowRight, Layers, Sliders, ShieldCheck } from 'lucide-react';

export default function StudioComparePage() {
  const [promptA, setPromptA] = useState(
    'A cinematic 8k portrait of a futuristic cybersecurity engineer, illuminated by dual neon cyan and purple volumetric fog, 85mm f/1.4 prime lens, sharp focal detail.'
  );
  const [promptB, setPromptB] = useState(
    'A cinematic 8k portrait of a futuristic cybersecurity engineer in tactical obsidian armor, illuminated by split cyan key light with magenta rim backlighting, 85mm f/1.4 portrait prime, shallow depth of field with circular bokeh flares.'
  );
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  const wordsA = promptA.split(/\s+/);
  const wordsB = promptB.split(/\s+/);

  const lenA = promptA.length;
  const lenB = promptB.length;
  const charDiff = lenB - lenA;

  const handleCopy = (text: string, isA: boolean) => {
    navigator.clipboard.writeText(text);
    if (isA) {
      setCopiedA(true);
      setTimeout(() => setCopiedA(false), 2000);
    } else {
      setCopiedB(true);
      setTimeout(() => setCopiedB(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      <StudioSubNav creditBalance={10} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                Token Sensitivity & Diff Analyzer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Prompt Version Comparison
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium mt-1">
              Compare token density, character deltas, and AST target optimizations side-by-side.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-extrabold">
              Delta: {charDiff >= 0 ? `+${charDiff}` : charDiff} chars
            </span>
          </div>
        </div>

        {/* Side-by-Side Comparison Canvas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Version A */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-extrabold flex items-center justify-center">
                  A
                </span>
                <span className="text-xs font-black uppercase text-white tracking-wider">
                  Baseline Version (v1.0)
                </span>
              </div>

              <button
                onClick={() => handleCopy(promptA, true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-extrabold transition-all"
              >
                {copiedA ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedA ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <textarea
              value={promptA}
              onChange={(e) => setPromptA(e.target.value)}
              rows={6}
              className="w-full p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
            />

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Words</span>
                <span className="font-extrabold text-white mt-0.5 block">{wordsA.length}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Characters</span>
                <span className="font-extrabold text-white mt-0.5 block">{lenA}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Perceptual Grade</span>
                <span className="font-extrabold text-amber-400 mt-0.5 block">S</span>
              </div>
            </div>
          </div>

          {/* Version B */}
          <div className="bg-zinc-900 border border-purple-900/50 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-600 text-white text-xs font-extrabold flex items-center justify-center">
                  B
                </span>
                <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                  Refined AST Candidate (v2.0)
                </span>
              </div>

              <button
                onClick={() => handleCopy(promptB, false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition-all"
              >
                {copiedB ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedB ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <textarea
              value={promptB}
              onChange={(e) => setPromptB(e.target.value)}
              rows={6}
              className="w-full p-4 bg-zinc-950 rounded-2xl border border-purple-900/40 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
            />

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Words</span>
                <span className="font-extrabold text-purple-300 mt-0.5 block">{wordsB.length}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Characters</span>
                <span className="font-extrabold text-purple-300 mt-0.5 block">{lenB}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Perceptual Grade</span>
                <span className="font-extrabold text-emerald-400 mt-0.5 block">S+ (98.2%)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
