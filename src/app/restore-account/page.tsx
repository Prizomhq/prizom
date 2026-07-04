'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cancelAccountDeletionAction } from '@/app/actions/profile';
import { Loader2, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import PrizomLogo from '@/components/ui/PrizomLogo';

export default function RestoreAccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletionDate, setDeletionDate] = useState<string | null>(null);
  const [loadingDate, setLoadingDate] = useState(true);

  useEffect(() => {
    const fetchDeletionDate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('scheduled_deletion_at')
          .eq('id', user.id)
          .single();

        if (profile?.scheduled_deletion_at) {
          const date = new Date(profile.scheduled_deletion_at);
          setDeletionDate(date.toDateString());
        }
      } catch (err) {
        console.error('Error fetching deletion date:', err);
      } finally {
        setLoadingDate(false);
      }
    };

    fetchDeletionDate();
  }, [supabase, router]);

  const handleCancelDeletion = () => {
    setError(null);
    startTransition(async () => {
      const res = await cancelAccountDeletionAction();
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);
      } else {
        setError(res.error || 'Failed to cancel deletion request.');
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
          <h1 className="text-2xl font-bold text-red-650 mb-2">Account Recovery</h1>
          <p className="text-zinc-550 text-sm font-semibold">Your account is scheduled for deletion.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/40 space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs text-amber-850 uppercase tracking-wider">Scheduled for Deletion</h4>
              <p className="text-xs text-zinc-555 mt-1 font-semibold">
                {loadingDate ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline-block text-amber-600" />
                ) : (
                  `Permanent deletion scheduled for: ${deletionDate || 'N/A'}`
                )}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 shrink-0 text-green-500" />
              <span>Deletion canceled! Redirecting to dashboard...</span>
            </div>
          )}

          <p className="text-sm text-zinc-500 leading-relaxed text-center font-semibold">
            You can restore your profile, prompts, and dashboard immediately. Click &quot;Cancel Deletion&quot; to keep your account.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCancelDeletion}
              disabled={isPending || success || loadingDate}
              className="w-full flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>Cancel Deletion</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center justify-center space-x-2 bg-white text-zinc-700 font-bold py-3.5 px-4 rounded-2xl border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Continue Deletion (Logout)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
