'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitAppealAction } from '@/app/actions/adminActions';
import { FileText, Send, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

interface AppealFormClientProps {
  username: string;
}

export default function AppealFormClient({ username }: AppealFormClientProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).turnstile && !isWidgetLoaded) {
      try {
        (window as any).turnstile.render('#turnstile-appeal-container', {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken('');
          },
          'error-callback': () => {
            setTurnstileToken('');
          }
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsWidgetLoaded(true);
      } catch (e) {
        console.warn('Turnstile appeal widget render warning:', e);
      }
    }
  }, [isWidgetLoaded]);

  const handleScriptLoad = () => {
    if ((window as any).turnstile && !isWidgetLoaded) {
      try {
        (window as any).turnstile.render('#turnstile-appeal-container', {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken('');
          },
          'error-callback': () => {
            setTurnstileToken('');
          }
        });
        setIsWidgetLoaded(true);
      } catch (e) {
        console.warn('Turnstile appeal script load warning:', e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA check.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await submitAppealAction(reason, supportingInfo, turnstileToken);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.error || 'Failed to submit appeal. Please try again.');
        if ((window as any).turnstile) {
          (window as any).turnstile.reset('#turnstile-appeal-container');
          setTurnstileToken('');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      if ((window as any).turnstile) {
        (window as any).turnstile.reset('#turnstile-appeal-container');
        setTurnstileToken('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-950/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-4">
            Appeal Submitted
          </h1>
          <p className="text-sm font-semibold text-zinc-400 leading-relaxed mb-8">
            Thank you. Your appeal has been submitted successfully and is currently under review by our moderation team. We will send an email confirmation to your registered email address once a decision has been reached.
          </p>

          <Link
            href="/suspended"
            className="w-full px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Warning Screen
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-950/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-zinc-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 text-white">
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-wider">Submit Appeal</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Account Suspension Appeal for @{username}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-400 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
              Reason for Appeal <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="block w-full px-4 py-3 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all text-base sm:text-xs font-bold shadow-inner leading-relaxed"
              placeholder="Please explain why you believe your suspension was incorrect or how you plan to address the violation..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
              Supporting Information (Optional)
            </label>
            <textarea
              value={supportingInfo}
              onChange={(e) => setSupportingInfo(e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all text-base sm:text-xs font-bold shadow-inner leading-relaxed"
              placeholder="Provide any additional context or references that might support your appeal..."
            />
          </div>

          {/* Cloudflare Turnstile CAPTCHA Container */}
          <div className="flex justify-center my-4">
            <div id="turnstile-appeal-container"></div>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href="/suspended"
              className="flex-1 px-6 py-4 border border-zinc-800 hover:bg-zinc-800/50 text-zinc-400 hover:text-white rounded-full text-xs font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 font-bold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !reason.trim() || !turnstileToken}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/20 hover:shadow-red-950/40 transition-all flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Send Appeal'}
            </button>
          </div>
        </form>
        <Script 
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={handleScriptLoad}
        />
      </div>
    </main>
  );
}
