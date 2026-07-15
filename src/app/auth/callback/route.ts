import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncAdminRole } from '@/app/actions/adminActions';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Trigger auto-sync role on callback
        const syncRes = await syncAdminRole();
        const role = syncRes.role || 'user';
        if (['super_admin', 'admin', 'moderator'].includes(role)) {
          return NextResponse.redirect(`${origin}/admin`);
        }
      }
      let safeNext = '/';
      if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
        safeNext = next;
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    
    return NextResponse.redirect(`${origin}/login?error=Invalid or expired verification link`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Trigger auto-sync role on OAuth callback (Goal 1 & 2)
        const syncRes = await syncAdminRole();
        const role = syncRes.role || 'user';
        if (['super_admin', 'admin', 'moderator'].includes(role)) {
          return NextResponse.redirect(`${origin}/admin`);
        }
      }
      let safeNext = '/';
      if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
        safeNext = next;
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}

