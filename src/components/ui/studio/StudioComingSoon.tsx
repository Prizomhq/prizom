'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Rocket } from 'lucide-react';
import PrizomLogo from '@/components/ui/PrizomLogo';

export function StudioComingSoon() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full max-w-lg mx-auto bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Subtle ambient neon background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Brand Icon Header */}
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner relative group">
            <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            <PrizomLogo size={28} className="relative z-10" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Private Beta</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4 flex items-center gap-2 justify-center">
            🚀 AI Studio is Coming Soon
          </h1>

          {/* Body Message */}
          <div className="space-y-3 text-zinc-400 text-sm sm:text-base font-medium leading-relaxed mb-8">
            <p>
              Prizom AI Studio is currently in private beta and is available only to internal testing.
            </p>
            <p>
              We are carefully building a world-class AI creator experience.
            </p>
            <p className="text-zinc-300 font-semibold">
              Public access will be enabled after production validation.
            </p>
            <p className="text-xs text-zinc-500 pt-2">
              Thank you for your patience. Stay tuned for the official launch.
            </p>
          </div>

          {/* Single Action Button */}
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
