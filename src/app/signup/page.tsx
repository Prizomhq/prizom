'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, Check, X, Eye, EyeOff, Key } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { checkUsernameAvailability, signUpAction } from '@/app/actions/auth';
import { syncAdminRole } from '@/app/actions/adminActions';
import Script from 'next/script';
import PrizomLogo from '@/components/ui/PrizomLogo';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteKey, setInviteKey] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation States
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToAge, setAgreeToAge] = useState(false);
  
  const router = useRouter();

  // TODO: Enable Google OAuth once client credentials are configured in Supabase console
  const ENABLE_GOOGLE_OAUTH = false;

  useEffect(() => {
    (window as any).onloadTurnstileCallback = () => {
      if ((window as any).turnstile && document.getElementById('turnstile-container')) {
        (window as any).turnstile.render('#turnstile-container', {
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
      }
    };

    if ((window as any).turnstile && document.getElementById('turnstile-container')) {
      (window as any).onloadTurnstileCallback();
    }
  }, []);
  const supabase = createClient();

  // Password Rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Debounced Username Check
  useEffect(() => {
    const checkUsername = async () => {
      const val = username.toLowerCase().trim();
      if (!val) {
        setUsernameStatus('idle');
        setUsernameError('');
        return;
      }

      if (val.length < 3 || val.length > 20 || !/^[a-z0-9_]+$/.test(val)) {
        setUsernameStatus('invalid');
        setUsernameError('3-20 chars, alphanumeric/underscore only');
        return;
      }

      setUsernameStatus('checking');
      const res = await checkUsernameAvailability(val);
      if (res.available) {
        setUsernameStatus('available');
        setUsernameError('');
      } else {
        setUsernameStatus('taken');
        setUsernameError(res.error || 'Taken');
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus !== 'available' || !isPasswordStrong || !passwordsMatch) {
      setError('Please fix the errors before submitting.');
      return;
    }
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA check.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await signUpAction(email, password, username, turnstileToken, inviteKey);

    if (!res.success) {
      setError(res.error || 'Failed to sign up.');
      if ((window as any).turnstile) {
        (window as any).turnstile.reset('#turnstile-container');
        setTurnstileToken('');
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('prizom_guest_copies');
      }

      // Track guest conversion event
      try {
        const newUserId = res.user?.id || null;
        if (newUserId) {
          const { trackGuestEvent } = await import('@/app/actions/guestActions');
          await trackGuestEvent('signup', { userId: newUserId });
        }
      } catch (trackErr) {
        console.error('Failed to log guest signup event:', trackErr);
      }
      
      setMessage('Account created successfully! Please check your email for the confirmation link.');
    }
    setLoading(false);

  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen relative w-full max-w-full flex items-center justify-center p-4 bg-[#fcfcfc] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 group mb-6 hover:scale-105 transition-transform">
            <PrizomLogo size={44} />
            <span className="font-bold text-3xl tracking-tight text-zinc-900">
              Prizom
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Create an account</h1>
          <p className="text-zinc-500">Join the ultimate AI image prompt community</p>
          <div className="mt-3.5 inline-flex items-center space-x-2 bg-amber-50/80 border border-amber-100/50 rounded-full px-4 py-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black text-amber-950 uppercase tracking-widest leading-none">
              Invite-Only Beta — Access Key Required
            </span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/40">
          {ENABLE_GOOGLE_OAUTH && (
            <>
              <button 
                onClick={handleGoogleSignup}
                type="button"
                className="w-full flex items-center justify-center space-x-3 bg-white text-zinc-700 font-bold py-3.5 px-4 rounded-2xl border border-zinc-200 hover:bg-zinc-50 transition-all mb-6 shadow-sm hover:shadow"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-zinc-500 font-medium">Or sign up with email</span>
                </div>
              </div>
            </>
          )}

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

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-bold text-zinc-700">Username</label>
                {usernameStatus === 'checking' && <span className="text-xs font-medium text-zinc-400 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Checking...</span>}
                {usernameStatus === 'available' && <span className="text-xs font-bold text-green-600 flex items-center"><Check className="w-3 h-3 mr-1"/> Available</span>}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <span className="text-xs font-bold text-red-600 flex items-center"><X className="w-3 h-3 mr-1"/> {usernameError}</span>}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${usernameStatus === 'available' ? 'text-green-500' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-500' : 'text-zinc-400'}`} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`block w-full pl-12 pr-4 py-3.5 border rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 text-base sm:text-sm transition-all shadow-inner
                    ${usernameStatus === 'invalid' || usernameStatus === 'taken' ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 
                      usernameStatus === 'available' ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20' : 
                      'border-zinc-200 focus:border-[var(--color-electric-blue)] focus:ring-[var(--color-electric-blue)]/20'}
                  `}
                  placeholder="creator123"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Invite Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  required
                  value={inviteKey}
                  onChange={(e) => setInviteKey(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[var(--color-electric-blue)] focus:ring-2 focus:ring-[var(--color-electric-blue)]/20 text-base sm:text-sm transition-all shadow-inner"
                  placeholder="prizom-beta-xxxx"
                />
              </div>
            </div>

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
                  className="block w-full pl-12 pr-4 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[var(--color-electric-blue)] focus:ring-2 focus:ring-[var(--color-electric-blue)]/20 text-base sm:text-sm transition-all shadow-inner"
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[var(--color-electric-blue)] focus:ring-2 focus:ring-[var(--color-electric-blue)]/20 text-base sm:text-sm transition-all shadow-inner"
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
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-3 bg-zinc-50 rounded-xl p-4 border border-zinc-100 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Password Requirements</p>
                  <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div className={`flex items-center ${hasMinLength ? 'text-green-600 font-bold' : 'text-zinc-500'}`}>
                      {hasMinLength ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mr-2.5 ml-1" />}
                      8+ characters
                    </div>
                    <div className={`flex items-center ${hasUpper ? 'text-green-600 font-bold' : 'text-zinc-500'}`}>
                      {hasUpper ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mr-2.5 ml-1" />}
                      Uppercase letter
                    </div>
                    <div className={`flex items-center ${hasLower ? 'text-green-600 font-bold' : 'text-zinc-500'}`}>
                      {hasLower ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mr-2.5 ml-1" />}
                      Lowercase letter
                    </div>
                    <div className={`flex items-center ${hasNumber ? 'text-green-600 font-bold' : 'text-zinc-500'}`}>
                      {hasNumber ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mr-2.5 ml-1" />}
                      Number
                    </div>
                    <div className={`flex items-center ${hasSpecial ? 'text-green-600 font-bold' : 'text-zinc-500'}`}>
                      {hasSpecial ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mr-2.5 ml-1" />}
                      Special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${confirmPassword.length > 0 ? (passwordsMatch ? 'text-green-500' : 'text-red-500') : 'text-zinc-400'}`} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-12 pr-12 py-3.5 border rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 text-base sm:text-sm transition-all shadow-inner
                    ${confirmPassword.length > 0 && !passwordsMatch ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 
                      passwordsMatch ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20' : 
                      'border-zinc-200 focus:border-[var(--color-electric-blue)] focus:ring-[var(--color-electric-blue)]/20'}
                  `}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs font-bold text-red-500 mt-2 ml-1">Passwords do not match</p>
              )}
            </div>

            {/* Cloudflare Turnstile CAPTCHA Container */}
            <div className="flex justify-center mt-6">
              <div id="turnstile-container"></div>
            </div>

            {/* Click-wrap Legal Consent and Age Confirmation */}
            <div className="mt-6 space-y-4 bg-zinc-50/50 p-4 border border-zinc-150 rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer select-none text-left">
                <input
                  type="checkbox"
                  checked={agreeToAge}
                  onChange={(e) => setAgreeToAge(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-zinc-500 font-bold leading-tight">
                  I confirm that I am at least 18 years of age (or meet the legal age of consent in my country).
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none text-left">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-zinc-500 font-bold leading-tight">
                  I agree to the <Link href="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link> including platform prompt remix policies.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || usernameStatus !== 'available' || !isPasswordStrong || !passwordsMatch || !turnstileToken || !inviteKey.trim() || !agreeToTerms || !agreeToAge}
              className="w-full flex items-center justify-center py-4 px-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] hover:shadow-[0_8px_25px_rgba(0,240,255,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none mt-6"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </button>
          </form>

          <Script 
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
            strategy="lazyOnload"
          />

          <p className="mt-8 text-center text-sm text-zinc-500 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--color-neon-purple)] hover:text-purple-700 font-bold transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
