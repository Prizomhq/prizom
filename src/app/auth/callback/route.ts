import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncAdminRole } from '@/app/actions/adminActions';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    
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
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
