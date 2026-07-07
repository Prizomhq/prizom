'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { sendPasswordResetEmail } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await sendPasswordResetEmail(email);

    if (!res.success) {
      setError(res.error || 'Failed to send reset email.');
    } else {
      setMessage('Password reset email sent! Check your inbox.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative w-full max-w-full flex items-center justify-center p-4 bg-[#fcfcfc] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 py-8">
        <Link href="/login" className="inline-flex items-center text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-6">
            <Lock className="h-8 w-8 text-[var(--color-neon-purple)]" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Forgot password?</h1>
          <p className="text-zinc-500">No worries, we&apos;ll send you reset instructions.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/40">
          
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium animate-in fade-in zoom-in-95">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all shadow-inner"
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center py-4 px-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(157,78,221,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none mt-8"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
