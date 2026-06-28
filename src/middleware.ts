import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { validateEnvironment } from '@/lib/environment_audit'

export async function middleware(request: NextRequest) {
  const envCheck = validateEnvironment();
  if (!envCheck.success) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: envCheck.error, missing: envCheck.missing },
        { status: 500 }
      );
    }
  }

  if (request.nextUrl.pathname === '/explore' || request.nextUrl.pathname.startsWith('/explore/')) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname.replace('/explore', '/discover');
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === '/upload' || request.nextUrl.pathname.startsWith('/upload/')) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname.replace('/upload', '/create');
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole = 'user';
  let isDeactivated = false;
  let isPendingDeletion = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_deactivated, pending_deletion')
      .eq('id', user.id)
      .single();
    if (profile) {
      userRole = profile.role || 'user';
      isDeactivated = profile.is_deactivated || false;
      isPendingDeletion = profile.pending_deletion || false;
    }
  }

  // Account Lifecycle routing checks
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth') || 
                    request.nextUrl.pathname.startsWith('/auth') ||
                    request.nextUrl.pathname.startsWith('/_next') ||
                    request.nextUrl.pathname === '/favicon.ico';

  if (user && !isAuthApi) {
    if (isPendingDeletion) {
      if (request.nextUrl.pathname !== '/restore-account') {
        const url = request.nextUrl.clone();
        url.pathname = '/restore-account';
        return NextResponse.redirect(url);
      }
    } else if (isDeactivated) {
      if (request.nextUrl.pathname !== '/reactivate-account') {
        const url = request.nextUrl.clone();
        url.pathname = '/reactivate-account';
        return NextResponse.redirect(url);
      }
    }
  }

  // Prevent accessing reactivate/restore pages if not applicable
  if (request.nextUrl.pathname === '/reactivate-account' && (!user || !isDeactivated)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  if (request.nextUrl.pathname === '/restore-account' && (!user || !isPendingDeletion)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Suspended or Banned routing checks
  if (userRole === 'suspended' || userRole === 'permanently_banned') {
    const isSuspendedPage = request.nextUrl.pathname === '/suspended';
    const isAppealPage = request.nextUrl.pathname === '/account-appeal';
    const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth') || 
                      request.nextUrl.pathname.startsWith('/auth') ||
                      request.nextUrl.pathname.startsWith('/_next') ||
                      request.nextUrl.pathname === '/favicon.ico';

    if (userRole === 'suspended') {
      if (!isSuspendedPage && !isAppealPage && !isAuthApi) {
        const url = request.nextUrl.clone();
        url.pathname = '/suspended';
        return NextResponse.redirect(url);
      }
    } else if (userRole === 'permanently_banned') {
      if (!isSuspendedPage && !isAuthApi) {
        const url = request.nextUrl.clone();
        url.pathname = '/suspended';
        return NextResponse.redirect(url);
      }
    }
  }

  // Protected routes check
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/profile') ||
                           request.nextUrl.pathname.startsWith('/create') ||
                           request.nextUrl.pathname.startsWith('/settings') ||
                           request.nextUrl.pathname.startsWith('/notifications');

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin routes protection (both pages and APIs under /admin or /api/admin)
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') ||
                       request.nextUrl.pathname.startsWith('/api/admin');

  if (isAdminRoute) {
    if (!user) {
      // Silently rewrite to /not-found to completely obfuscate route existence (returns 404)
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    const isAdmin = ['super_admin', 'admin', 'moderator'].includes(userRole);

    if (!isAdmin) {
      // Silently rewrite to /not-found to completely obfuscate route existence (returns 404)
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    // Strict sub-route permissions checks
    const path = request.nextUrl.pathname;
    
    // 1. Super admin only routes: Team configurations
    const isTeamSettings = path === '/admin/content' && request.nextUrl.searchParams.get('tab') === 'team';
    if (isTeamSettings && userRole !== 'super_admin') {
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    // 2. Admin & Super Admin only routes: Users and general content management
    const isUsersManagement = path === '/admin/users';
    const isContentManagement = path === '/admin/content' && !isTeamSettings;
    if ((isUsersManagement || isContentManagement) && !['super_admin', 'admin'].includes(userRole)) {
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }
  }

  return supabaseResponse
}

export const config = {
  unstable_allowDynamic: [
    '/node_modules/**',
  ],
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
