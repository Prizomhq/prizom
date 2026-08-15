'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Send,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';
import PrizomLogo from '@/components/ui/PrizomLogo';
import { PrizomAIStudioMark } from '@/components/ui/PrizomAIStudioMark';
import { AiStudioAccessResult } from '@/lib/ai-studio/guard';
import { submitEarlyAccessApplicationAction } from '@/app/actions/earlyAccess';

interface StudioComingSoonProps {
  accessResult: AiStudioAccessResult;
  userEmail?: string | null;
}

export function StudioComingSoon({ accessResult, userEmail }: StudioComingSoonProps) {
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
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-500 selection:text-white flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* Refined Ambient Background Backdrop */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-purple-900/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header Navigation */}
      <header className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 group transition-opacity hover:opacity-90">
          <PrizomLogo size={32} />
          <span className="font-bold text-base text-white tracking-tight">Prizom</span>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Hero Waiting Room Container */}
      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        
        {/* Original Prizom AI Studio Icon Badge */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-purple-500/20 rounded-3xl blur-xl transition-all duration-500 group-hover:bg-purple-500/30" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-900 border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-950/40">
            <PrizomAIStudioMark size={48} variant="gradient" />
          </div>
        </div>

        {/* Status Pill */}
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Coming Soon</span>
        </div>

        {/* Primary Product Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          AI Studio
        </h1>

        {/* One-Line Value Proposition */}
        <p className="text-zinc-400 text-base sm:text-lg font-medium max-w-lg mx-auto mb-10 leading-relaxed text-balance">
          Turn your AI-generated images into detailed, reusable prompts.
        </p>

        {/* Primary Access Control Card & Journey */}
        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl transition-all">

          {/* 1. Normal User (Logged in, not applied yet) */}
          {currentStatus === 'coming_soon' && (
            <div className="space-y-4 text-center">
              <button
                onClick={() => setShowApplyModal(true)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-purple-950/50 hover:shadow-purple-500/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <span>Get Early Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-zinc-500 font-medium">
                We&apos;ll notify you when it&apos;s ready.
              </p>
            </div>
          )}

          {/* 2. Unauthenticated Guest */}
          {currentStatus === 'unauthenticated' && (
            <div className="space-y-4 text-center">
              <Link
                href="/login?next=/studio"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-purple-950/50 hover:shadow-purple-500/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <span>Log In & Request Early Access</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-zinc-500 font-medium">
                Log in to join the Early Access waitlist.
              </p>
            </div>
          )}

          {/* 3. Pending Application User */}
          {currentStatus === 'pending' && (
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white">Early Access Requested</h2>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                We&apos;ll let you know when AI Studio is available for you.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Waitlist Pending</span>
                </span>
              </div>
            </div>
          )}

          {/* 4. Rejected Application User */}
          {currentStatus === 'rejected' && (
            <div className="space-y-3 text-center">
              <h2 className="text-base font-bold text-white">Early Access Status</h2>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Access is currently restricted during early rollout, but standard release will be available soon.
              </p>
            </div>
          )}

          {/* 5. Revoked User */}
          {currentStatus === 'revoked' && (
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white">Access Restricted</h2>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Early access permission for your account has been updated by administration.
              </p>
            </div>
          )}

        </div>

      </main>

      {/* Clean Modal for Early Access Submission */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 text-left">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Request Early Access</h3>
              <p className="text-xs text-zinc-400 font-medium">
                Apply now to test AI Studio prompt reverse engineering before public launch.
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Why do you want Early Access? <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Share your AI image creation use case or workflow..."
                  className="w-full p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
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
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 border-t border-zinc-900/80 text-center text-xs text-zinc-600 font-medium flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Prizom AI Studio</span>
        <div className="flex items-center gap-5 text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
          <Link href="/discover" className="hover:text-zinc-300 transition-colors">Discover</Link>
          <Link href="/trending" className="hover:text-zinc-300 transition-colors">Trending</Link>
        </div>
      </footer>

    </div>
  );
}
