'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { updateSecurePassword } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password Rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordStrong || !passwordsMatch) {
      setError('Please fix the errors before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await updateSecurePassword(password);

    if (!res.success) {
      setError(res.error || 'Failed to update password.');
    } else {
      setMessage('Password successfully reset! You can now log in.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative w-full max-w-full flex items-center justify-center p-4 bg-[#fcfcfc] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 group mb-6 hover:scale-105 transition-transform">
            <span className="font-bold text-3xl tracking-tight text-zinc-900">
              Prizom
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Set new password</h1>
          <p className="text-zinc-500">Please enter your new strong password.</p>
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
              <div className="mt-4">
                <Link href="/login" className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-black hover:bg-zinc-800 transition-colors">
                  Go to Login
                </Link>
              </div>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[var(--color-electric-blue)] focus:ring-2 focus:ring-[var(--color-electric-blue)]/20 transition-all shadow-inner"
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
                    <div className="grid grid-cols-2 gap-2 text-xs">
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
                    className={`block w-full pl-12 pr-12 py-3.5 border rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 transition-all shadow-inner
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

              <button
                type="submit"
                disabled={loading || !isPasswordStrong || !passwordsMatch}
                className="w-full flex items-center justify-center py-4 px-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(157,78,221,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none mt-8"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set New Password'}
                {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
