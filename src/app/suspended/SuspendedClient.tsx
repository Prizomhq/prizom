'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, LogOut, FileText } from 'lucide-react';
import { useState } from 'react';

interface SuspendedClientProps {
  username: string;
  role: string;
  reason: string;
  daysRemaining: number;
}

export default function SuspendedClient({ username, role, reason, daysRemaining }: SuspendedClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const isBanned = role === 'permanently_banned';

  return (
    <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-950/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-rose-950/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl relative z-10 text-center">
        {/* Warning Icon Banner */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-2">
          {isBanned ? 'Account Permanently Banned' : 'Account Suspended'}
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mb-6">
          Decision ID: {username.toUpperCase()}
        </p>

        {/* Info Box */}
        <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 mb-8 text-left space-y-4">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
              Violating Account
            </span>
            <span className="text-sm font-bold text-white">@{username}</span>
          </div>

          <div>
            <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
              Moderator Action Reason
            </span>
            <p className="text-xs font-semibold text-zinc-300 leading-relaxed bg-zinc-900/50 border border-zinc-800/30 rounded-xl px-4 py-3 shadow-inner">
              {reason}
            </p>
          </div>

          {!isBanned && (
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                Suspension Window
              </span>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-red-400 animate-pulse">{daysRemaining} days remaining</span>
                <span className="text-zinc-500">out of 15 days</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-red-500 to-rose-600 h-1.5 rounded-full"
                  style={{ width: `${(daysRemaining / 15) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {isBanned ? (
          <p className="text-xs font-semibold text-zinc-500 leading-relaxed mb-8">
            Your Prizom account has been permanently banned for severe or repeated violations of platform policies. This action is final and cannot be appealed.
          </p>
        ) : (
          <p className="text-xs font-semibold text-zinc-500 leading-relaxed mb-8">
            Your account will remain suspended for 15 days. If you believe this suspension was made in error, you may submit a formal appeal detailing your case.
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          {!isBanned && (
            <Link 
              href="/account-appeal"
              className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/20 hover:shadow-red-950/40 transition-all flex items-center justify-center gap-2 font-bold"
            >
              <FileText className="w-4 h-4" />
              Appeal Decision
            </Link>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full px-6 py-4 border border-zinc-800 hover:bg-zinc-800/50 text-zinc-400 hover:text-white rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none font-bold"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </main>
  );
}
