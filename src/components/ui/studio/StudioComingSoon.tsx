'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Layers, 
  Eye, 
  Wand2, 
  Camera, 
  Cpu, 
  Send,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import PrizomLogo from '@/components/ui/PrizomLogo';
import { AiStudioAccessResult } from '@/lib/ai-studio/guard';
import { submitEarlyAccessApplicationAction } from '@/app/actions/earlyAccess';

interface StudioComingSoonProps {
  accessResult: AiStudioAccessResult;
  userEmail?: string | null;
}

export function StudioComingSoon({ accessResult, userEmail }: StudioComingSoonProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>(accessResult.reason);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await submitEarlyAccessApplicationAction(reason);
    if (res.success) {
      setCurrentStatus('pending');
      setShowApplyModal(false);
    } else {
      setError(res.error || 'Failed to submit application.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-500 selection:text-white flex flex-col justify-between overflow-x-hidden">
      
      {/* Background Ambient Lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-900/20 via-indigo-900/10 to-transparent blur-[160px]" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[60%] -right-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Header / Breadcrumb */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <PrizomLogo size={32} />
          <span className="font-extrabold text-lg text-white tracking-tight">Prizom AI Studio</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Gated Release</span>
        </div>
      </div>

      {/* Main Hero Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center items-center text-center space-y-12">
        
        {/* Status Pill & Badge */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-widest shadow-xl">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Coming Soon — Phase 1 Early Access Rollout</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] text-balance">
            Reverse Engineer Any Image Into <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500">
              Production Prompt Formulas
            </span>
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            AI Studio is Prizom&apos;s upcoming visual reverse engineering suite. Upload an image to analyze Style DNA, optics parameters, and multi-model compiled prompt formulas.
          </p>
        </div>

        {/* Dynamic Contextual Application Card */}
        <div className="w-full max-w-xl bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 text-left relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Guest State */}
          {currentStatus === 'unauthenticated' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Log In to Request Early Access</h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed">
                Prizom AI Studio is currently rolling out to select creators. Log into your Prizom account to submit your Early Access application.
              </p>
              <Link
                href={`/login?next=/studio`}
                className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg hover:shadow-purple-500/20 cursor-pointer"
              >
                <span>Log In & Apply</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Pending Application State */}
          {currentStatus === 'pending' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Clock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Application Submitted</h2>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-medium leading-relaxed">
                You are on the <strong className="text-purple-400 font-bold">AI Studio Early Access Waitlist</strong>. Super Admin is reviewing applications in batches. You will receive an in-app notification as soon as your access is approved.
              </div>
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Status: Waitlist Pending</span>
              </div>
            </div>
          )}

          {/* Rejected Application State */}
          {currentStatus === 'rejected' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
                <Info className="w-7 h-7 text-zinc-400" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Early Access Status</h2>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-medium leading-relaxed">
                Early Access for AI Studio is currently limited. Your application is saved and access will be enabled during our standard public feature release.
              </div>
            </div>
          )}

          {/* Revoked Application State */}
          {currentStatus === 'revoked' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Access Restricted</h2>
              <p className="text-zinc-400 text-xs font-medium">
                Early access permission for your account is currently restricted.
              </p>
            </div>
          )}

          {/* Coming Soon / Ready to Apply State */}
          {currentStatus === 'coming_soon' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Request Creator Early Access</h3>
                    <p className="text-xs text-zinc-400 font-medium">Apply now to test reverse prompt generation before public release.</p>
                  </div>
                </div>
              </div>

              {!showApplyModal ? (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer active:scale-98"
                >
                  <span>Get Early Access</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Why do you want Early Access? <span className="text-zinc-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tell us about your creator use case or favorite AI tools (Midjourney, Flux, etc.)..."
                      className="w-full p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Application</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Feature Grid Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl text-left pt-6">
          {[
            {
              icon: Wand2,
              title: 'Image → Prompt AST',
              desc: 'Compiles visual input into accurate prompt syntax, weights, and subject descriptors.'
            },
            {
              icon: Eye,
              title: 'Style DNA Extraction',
              desc: 'Identifies color palettes, lighting formulas, medium characteristics, and aesthetic genres.'
            },
            {
              icon: Camera,
              title: 'Optics Parameter Reconstruction',
              desc: 'Reconstructs camera lens types, focal lengths, aperture stops, and aspect ratios.'
            },
            {
              icon: Cpu,
              title: 'Multi-Model Compilation',
              desc: 'Generates tailored parameters for Midjourney, Flux, Stable Diffusion, and DALL-E.'
            }
          ].map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div 
                key={i}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 space-y-3 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white">{pillar.title}</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>

      </main>

      {/* Simple Footer */}
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 border-t border-zinc-900 text-center text-xs text-zinc-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} Prizom AI Studio. Controlled Rollout Phase.</span>
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-zinc-300 transition-colors">Homepage</Link>
          <Link href="/discover" className="hover:text-zinc-300 transition-colors">Prompt Catalog</Link>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
        </div>
      </footer>

    </div>
  );
}
