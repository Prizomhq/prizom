'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { reactivateAccountAction } from '@/app/actions/profile';
import { Loader2, LogOut, CheckCircle2 } from 'lucide-react';
import PrizomLogo from '@/components/ui/PrizomLogo';

export default function ReactivateAccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReactivate = () => {
    setError(null);
    startTransition(async () => {
      const res = await reactivateAccountAction();
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);
      } else {
        setError(res.error || 'Failed to reactivate account.');
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen relative w-full flex items-center justify-center p-4 bg-[#fcfcfc] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-6">
            <PrizomLogo size={44} />
            <span className="font-bold text-3xl tracking-tight text-zinc-900">Prizom</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Welcome Back!</h1>
          <p className="text-zinc-550 text-sm font-semibold">Your account is currently deactivated.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/40 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 shrink-0 text-green-500" />
              <span>Account reactivated successfully! Redirecting...</span>
            </div>
          )}

          <p className="text-sm text-zinc-500 leading-relaxed text-center">
            Reactivating your account will instantly restore your profile visibility, prompts, collections, and rankings to the community.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleReactivate}
              disabled={isPending || success}
              className="w-full flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>Reactivate Account</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center justify-center space-x-2 bg-white text-zinc-700 font-bold py-3.5 px-4 rounded-2xl border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
