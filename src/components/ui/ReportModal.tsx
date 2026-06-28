'use client';

import { useState, useTransition } from 'react';
import { X, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { reportPrompt, reportUser } from '@/app/actions/moderation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'prompt' | 'creator';
  entityId: string;
  entityName: string;
}

export default function ReportModal({ isOpen, onClose, type, entityId, entityName }: ReportModalProps) {
  const [reason, setReason] = useState(type === 'prompt' ? 'NSFW content' : 'spam');
  const [details, setDetails] = useState('');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const promptReasons = [
    'NSFW content',
    'spam',
    'stolen content',
    'misleading prompt',
    'hate/abuse',
    'copyright issue',
    'other'
  ];

  const creatorReasons = [
    'spam',
    'harassment',
    'NSFW content',
    'impersonation',
    'hateful behavior',
    'scam/fake account',
    'other'
  ];

  const reasons = type === 'prompt' ? promptReasons : creatorReasons;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      let res;
      if (type === 'prompt') {
        res = await reportPrompt(entityId, reason, details);
      } else {
        res = await reportUser(entityId, reason, details);
      }

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setDetails('');
          onClose();
        }, 2500);
      } else {
        setError(res.error || 'Failed to submit report. Please try again.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isPending && onClose()}
      />

      {/* Modal Card */}
      <div className="bg-white/95 border border-zinc-200/60 rounded-[2rem] max-w-md w-full shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden transform animate-in fade-in zoom-in-95 duration-250">
        
        {/* Glowing visual accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-neon-purple)] via-red-500 to-[var(--color-accent-pink)]"></div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500 shadow-md">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2">Report Submitted</h3>
            <p className="text-zinc-500 text-sm font-semibold max-w-xs leading-relaxed">
              Thank you for keeping Prizom safe. Our moderation team has received your report and will audit "{entityName}" shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <div className="flex items-center space-x-2.5 text-zinc-900">
                <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black tracking-tight">
                  Report {type === 'prompt' ? 'Prompt' : 'Creator'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={onClose}
                disabled={isPending}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">
                  Target Asset
                </label>
                <div className="px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl font-bold text-sm text-zinc-800 truncate">
                  {type === 'prompt' ? '🖼️' : '👤'} {entityName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">
                  Select Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isPending}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 font-semibold focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all appearance-none"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>{r.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">
                  Additional Details
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  disabled={isPending}
                  rows={4}
                  maxLength={500}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 focus:bg-white text-zinc-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all text-sm font-semibold leading-relaxed"
                  placeholder="Explain why this content violates guidelines..."
                ></textarea>
                <span className="block text-right text-[10px] text-zinc-400 font-bold mt-1">
                  {details.length}/500 chars
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-full text-sm transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-[0_4px_15px_rgba(239,68,68,0.3)] text-white font-bold rounded-full text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
