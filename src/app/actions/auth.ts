'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { rateLimit } from '@/lib/rateLimit';
import { getClientIpHash } from './interactions';

export async function checkUsernameAvailability(username: string) {
  // Enforce lowercase and rules before even hitting DB
  const sanitized = username.toLowerCase().trim();
  
  if (sanitized.length < 3 || sanitized.length > 20) {
    return { available: false, error: 'Username must be between 3 and 20 characters.' };
  }
  if (!/^[a-z0-9_]+$/.test(sanitized)) {
    return { available: false, error: 'Only letters, numbers, and underscores allowed.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', sanitized)
    .maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    return { available: false, error: 'Error checking username availability.' };
  }

  if (data) {
    return { available: false, error: 'Username is already taken.' };
  }

  return { available: true };
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error('Reset password error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateSecurePassword(password: string) {
  // Validate password strength server-side (min 8 chars, uppercase, lowercase, number, special char)
  const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  if (!isStrong) {
    return { success: false, error: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    console.error('Update password error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function checkRateLimitAction(action: 'login' | 'signup') {
  const ipHash = await getClientIpHash();
  // Allow 5 login/signup attempts per 5 minutes per IP
  const res = await rateLimit(ipHash, action, 5, 5 * 60 * 1000);
  return { 
    success: res.success, 
    remaining: res.remaining, 
    resetAt: res.resetAt.toISOString(),
    error: res.success ? null : 'Too many attempts. Please try again in a few minutes.'
  };
}

export async function signUpAction(
  email: string,
  password: string,
  username: string,
  turnstileToken: string,
  inviteKey: string
) {
  // 1. Validate password strength server-side (min 8 chars, uppercase, lowercase, number, special char)
  const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  if (!isStrong) {
    return { success: false, error: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.' };
  }

  // 2. Rate Limiting check
  const ipHash = await getClientIpHash();
  const limitCheck = await rateLimit(ipHash, 'signup', 5, 5 * 60 * 1000);
  if (!limitCheck.success) {
    return { success: false, error: 'Too many signup attempts. Please try again in a few minutes.' };
  }

  // 3. Turnstile CAPTCHA Token validation
  const captchaCheck = await verifyTurnstileToken(turnstileToken);
  if (!captchaCheck.success) {
    return { success: false, error: captchaCheck.error || 'CAPTCHA validation failed.' };
  }

  // 4. Username availability check
  const availability = await checkUsernameAvailability(username);
  if (!availability.available) {
    return { success: false, error: availability.error || 'Username is not available.' };
  }

  // 5. Invite Key validation
  if (!inviteKey || !inviteKey.trim()) {
    return { success: false, error: 'Invite key is required.' };
  }

  const adminSupabase = await createAdminClient();
  const { data: keyData, error: keyError } = await adminSupabase
    .from('invite_keys')
    .select('*')
    .ilike('key', inviteKey.trim())
    .eq('is_active', true)
    .maybeSingle();

  if (keyError || !keyData) {
    return { success: false, error: 'Invalid or inactive invite key.' };
  }

  if (keyData.uses >= keyData.max_uses) {
    return { success: false, error: 'This invite key has reached its maximum usage limit.' };
  }

  // 5. Supabase Auth signup call
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
        invite_key: inviteKey.trim(),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://prizom.in'}/auth/callback`,
    },
  });

  if (error) {
    console.error('[SIGNUP ACTION ERROR] Auth sign up failed:', error.message);
    if (error.message.includes('User already registered')) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}
