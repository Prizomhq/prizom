'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { authenticateAdmin, syncAdminRole } from '@/app/actions/adminActions';
import PrizomLogo from '@/components/ui/PrizomLogo';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Verify email matches authorized list in Server Action first
      const authCheck = await authenticateAdmin(email);
      if (!authCheck.success) {
        setError(authCheck.error || 'Access Denied: Email not in the authorized administrator whitelist.');
        setLoading(false);
        return;
      }

      // 2. Perform standard Supabase authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Incorrect credentials. Please verify your administrator password.');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        // 3. Perform server-side role synchronization (bootstrap)
        const syncRes = await syncAdminRole();
        if (!syncRes.success) {
          setError(syncRes.error || 'Security Sync Failure: Unable to bind administrative privileges.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // 4. Redirect to secure workspace
        router.push('/admin');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative w-full max-w-full flex items-center justify-center p-4 bg-[#fcfcfc] overflow-hidden text-zinc-800">
      {/* Sleek Light Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />
      
      {/* Neon glowing ambient circles */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-purple-500/5 via-indigo-500/5 to-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 group mb-6 hover:scale-105 transition-transform">
            <PrizomLogo size={40} />
            <span className="font-black text-3xl tracking-tight text-zinc-900">
              Prizom <span className="text-xs bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-md uppercase tracking-wider font-extrabold ml-1">Admin</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 mb-1">Administrative Node</h1>
          <p className="text-zinc-650 text-xs font-semibold">Secure Authorization Endpoint</p>
        </div>

        <div className="bg-white border border-zinc-200 p-8 rounded-3xl shadow-2xl backdrop-blur-2xl">
          
          <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 font-bold leading-normal">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Authorized credentials only. Unauthorized access attempts are monitored and recorded.</span>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-650 text-xs font-bold leading-relaxed animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 mb-2">Admin Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs font-bold shadow-inner"
                  placeholder="name@prizom.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600">Secret Token</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs font-bold shadow-inner"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-4 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-[var(--color-neon-purple)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none transition-all mt-8"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter Dashboard'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-zinc-550 font-bold uppercase tracking-widest">
            Protected by Cloud Node Security
          </p>
        </div>
      </div>
    </div>
  );
}
