'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { syncAdminRole } from '@/app/actions/adminActions';
import PrizomLogo from '@/components/ui/PrizomLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const ENABLE_GOOGLE_OAUTH = false;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Rate Limit check
    try {
      const { checkRateLimitAction } = await import('@/app/actions/auth');
      const limitCheck = await checkRateLimitAction('login');
      if (!limitCheck.success) {
        setError(limitCheck.error || 'Too many attempts. Please try again later.');
        setLoading(false);
        return;
      }
    } catch (limitErr) {
      console.warn('Rate limit check failed to execute:', limitErr);
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(signInError.message);
      }
      setLoading(false);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('prizom_guest_copies');
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Trigger auto-sync role on login (Goal 1)
        const syncRes = await syncAdminRole();
        const role = syncRes.role || 'user';
        if (['super_admin', 'admin', 'moderator'].includes(role)) {
          router.push('/admin');
          router.refresh();
          return;
        }
      }
      router.push('/');
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen relative w-full max-w-full flex items-center justify-center p-4 bg-[#fcfcfc] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 group mb-6 hover:scale-105 transition-transform">
            <PrizomLogo size={44} />
            <span className="font-bold text-3xl tracking-tight text-zinc-900">
              Prizom
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Welcome back</h1>
          <p className="text-zinc-500">Log in to your account to continue</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/40">
          {ENABLE_GOOGLE_OAUTH && (
            <>
              <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center space-x-3 bg-white text-zinc-700 font-bold py-3.5 px-4 rounded-2xl border border-zinc-200 hover:bg-zinc-50 transition-all mb-6 shadow-sm hover:shadow"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-zinc-500 font-medium">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  className="block w-full pl-12 pr-4 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 text-base sm:text-sm transition-all shadow-inner"
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-zinc-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-[var(--color-neon-purple)] hover:text-purple-700 transition-colors">
                  Forgot password?
                </Link>
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
                  className="block w-full pl-12 pr-12 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 text-base sm:text-sm transition-all shadow-inner"
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
              className="w-full flex items-center justify-center py-4 px-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(157,78,221,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none mt-8"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[var(--color-electric-blue)] hover:text-cyan-600 font-bold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
