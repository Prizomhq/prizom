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
    <div className="min-h-screen bg-[var(--background)] text-slate-900 selection:bg-indigo-600 selection:text-white flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* Top Header Navigation */}
      <header className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 group transition-opacity hover:opacity-90">
          <PrizomLogo size={32} />
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">Prizom</span>
        </Link>

        <Link
          href="/"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors px-3.5 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Hero Waiting Room Container */}
      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        
        {/* Prizom AI Studio Feature Icon Badge */}
        <div className="mb-6 relative group">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center shadow-md">
            <PrizomAIStudioMark size={48} variant="gradient" />
          </div>
        </div>

        {/* Status Pill */}
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Early Access Rollout</span>
        </div>

        {/* Primary Product Title */}
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
          AI Studio
        </h1>

        {/* Value Proposition */}
        <p className="text-slate-600 text-base sm:text-lg font-medium max-w-lg mx-auto mb-8 leading-relaxed">
          Turn your AI-generated images into detailed, reusable prompts.
        </p>

        {/* Primary Access Control Card */}
        <div className="w-full max-w-md bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md glass-card transition-all">

          {/* 1. Logged in user, early access open */}
          {currentStatus === 'coming_soon' && (
            <div className="space-y-4 text-center">
              <button
                onClick={() => setShowApplyModal(true)}
                className="w-full py-3.5 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <span>Request Early Access</span>
                <ArrowRight className="w-4 h-4 text-indigo-300" />
              </button>
              <p className="text-xs text-slate-500 font-medium">
                We will notify you as soon as your access is approved.
              </p>
            </div>
          )}

          {/* 2. Unauthenticated Guest */}
          {currentStatus === 'unauthenticated' && (
            <div className="space-y-4 text-center">
              <Link
                href="/login?next=/studio"
                className="w-full py-3.5 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <span>Log In & Request Early Access</span>
                <ArrowRight className="w-4 h-4 text-indigo-300" />
              </Link>
              <p className="text-xs text-slate-500 font-medium">
                Log in to join the Early Access waitlist.
              </p>
            </div>
          )}

          {/* 3. Pending Application User */}
          {currentStatus === 'pending' && (
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-200 mb-1">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Early Access Requested</h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Your application is currently under review by the team.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Waitlist Pending</span>
                </span>
              </div>
            </div>
          )}

          {/* 4. Rejected Application User */}
          {currentStatus === 'rejected' && (
            <div className="space-y-3 text-center">
              <h2 className="text-base font-bold text-slate-900">Early Access Status</h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Access is restricted during early rollout, but general release will open soon.
              </p>
            </div>
          )}

          {/* 5. Revoked User */}
          {currentStatus === 'revoked' && (
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-200 mb-1">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Early access permission has been updated for this account.
              </p>
            </div>
          )}

        </div>

      </main>

      {/* Clean Modal for Early Access Submission */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 text-left">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Request Early Access</h3>
              <p className="text-xs text-slate-600 font-medium">
                Apply to test AI Studio prompt reconstruction before public launch.
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Why do you want Early Access? <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Share your AI image creation workflow or use case..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <Send className="w-3.5 h-3.5 text-indigo-300" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 border-t border-slate-200/60 text-center text-xs text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Prizom AI Studio</span>
        <div className="flex items-center gap-5 text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <Link href="/discover" className="hover:text-slate-900 transition-colors">Discover</Link>
          <Link href="/trending" className="hover:text-slate-900 transition-colors">Trending</Link>
        </div>
      </footer>

    </div>
  );
}

