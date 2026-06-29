'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, LogOut, User as UserIcon, Settings as SettingsIcon, Plus, Terminal, Home, Compass, Bell, User2, Search as SearchIcon, TrendingUp, HelpCircle, Info, Bookmark, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import GlobalSearch from '@/components/ui/GlobalSearch';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import PrizomLogo, { PrizomWordmark } from '@/components/ui/PrizomLogo';
import { getUnreadNotificationCount } from '@/app/actions/notifications';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Accessibility: Trap keyboard focus inside mobile menu when open
  useEffect(() => {
    if (!isOpen || !mobileMenuRef.current) return;

    const menuEl = mobileMenuRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;

      const focusableEls = menuEl.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableEls.length === 0) return;

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    // Focus first element in menu on open
    const focusableEls = menuEl.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableEls.length > 0) {
      focusableEls[0].focus();
    }

    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClose = () => setProfileMenuOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setProfile(data);
        }
      } catch (err) {
        console.warn('Failed to fetch user or profile on mount:', err);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => { if (data) setProfile(data); })
          .catch(err => console.warn('Failed to fetch profile in onAuthStateChange:', err));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, supabase, pathname]);

  useEffect(() => {
    if (profile) {
      if (profile.interests) {
        try {
          const dbInterests = typeof profile.interests === 'string' 
            ? JSON.parse(profile.interests) 
            : profile.interests;
          if (dbInterests) {
            const normalized = {
              categories: dbInterests.categories || {},
              tools: dbInterests.tools || {},
              aspectRatios: dbInterests.aspectRatios || {},
              tags: dbInterests.tags || {},
              creators: dbInterests.creators || {},
              searches: dbInterests.searches || []
            };
            localStorage.setItem('prizom_interests_v2', JSON.stringify(normalized));
          }
        } catch (e) {
          console.error('Error syncing database interests to localStorage:', e);
        }
      }
    } else if (profile === null && typeof window !== 'undefined') {
      localStorage.removeItem('prizom_interests_v2');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchCount();

    // Subscribe to realtime notification changes for this user (P1-3)
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-[100] glass-nav transition-all duration-300 border-b border-zinc-200/50 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="relative flex justify-between items-center h-16">
            {/* Left Column: Brand & Main Navigation */}
            <div className="flex items-center space-x-8 z-20 shrink-0">
              <Link href="/" className="flex items-center space-x-2.5 group text-zinc-900 hover:text-[var(--color-neon-purple)] transition-colors">
                <PrizomLogo size={40} className="transition-transform group-hover:scale-105" />
                <PrizomWordmark height={20} className="hidden xl:block transition-transform group-hover:scale-102" />
                <span className="hidden xl:inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[8px] font-extrabold uppercase tracking-wider select-none leading-none border border-zinc-250/30 align-middle">
                  Beta
                </span>
              </Link>
              
              <div className="hidden lg:flex space-x-6">
                <Link href="/discover" className={`text-sm transition-colors hover:text-[var(--color-electric-blue)] ${pathname === '/discover' ? 'text-zinc-900 font-bold' : 'text-zinc-500 font-medium'}`}>Discover</Link>
                <Link href="/trending" className={`text-sm transition-colors hover:text-[var(--color-neon-purple)] ${pathname === '/trending' ? 'text-zinc-900 font-bold' : 'text-zinc-500 font-medium'}`}>Trending</Link>
              </div>
            </div>

            {/* Center Column: Centered Search (Responsive Flow) */}
            <div className="hidden md:flex flex-1 max-w-[380px] lg:max-w-[440px] xl:max-w-[560px] mx-auto items-center justify-center z-30 px-4">
              <GlobalSearch />
            </div>

            {/* Right Column: User Actions & Auth status */}
            <div className="hidden lg:flex items-center space-x-4 z-20 shrink-0">
              {user ? (
                <>
                  {((profile && ['super_admin', 'admin', 'moderator'].includes(profile.role)) || 
                    (user && ['super_admin', 'admin', 'moderator'].includes(user.user_metadata?.role))) && (
                    <Link 
                      href="/admin" 
                      className="flex items-center space-x-1.5 px-3 py-2 lg:px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] shadow-sm group"
                      aria-label="Admin Panel"
                    >
                      <Terminal className="h-3.5 w-3.5 text-purple-400 group-hover:animate-pulse" />
                      <span className="hidden xl:inline">Admin Panel</span>
                    </Link>
                  )}
                  
                  <Link 
                    href="/create" 
                    className="flex items-center space-x-1.5 px-3 py-2 lg:px-4 rounded-full bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-bold border border-zinc-200 transition-all hover:border-neon-purple shadow-sm"
                    aria-label="Create Prompt"
                  >
                    <Plus className="h-4 w-4 text-neon-purple" />
                    <span className="hidden xl:inline">Create Prompt</span>
                  </Link>
                  
                  <NotificationDropdown />
                  <div className="flex items-center space-x-3 border-l border-zinc-200 pl-4 relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileMenuOpen(!profileMenuOpen);
                      }}
                      className="focus:outline-none w-11 h-11 flex items-center justify-center hover:bg-zinc-50 rounded-full transition-colors"
                      aria-label="Profile Menu"
                    >
                      <Avatar 
                        src={profile?.avatar_url} 
                        username={profile?.username || user.email || 'U'} 
                        size="sm" 
                        className="hover:scale-105 transition-transform cursor-pointer border border-zinc-200/50" 
                      />
                    </button>

                    {profileMenuOpen && (
                      <div className="absolute right-0 top-10 mt-2 w-48 bg-white border border-zinc-200/60 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-4 py-2 border-b border-zinc-100 mb-1">
                          <p className="text-xs font-black text-zinc-900 truncate">
                            {profile?.full_name || profile?.username || 'User'}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-bold truncate">
                            @{profile?.username || 'unknown'}
                          </p>
                        </div>
                        <Link 
                          href="/profile" 
                          onClick={() => setProfileMenuOpen(false)}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                          View Profile
                        </Link>
                        <Link 
                          href="/settings" 
                          onClick={() => setProfileMenuOpen(false)}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-zinc-100/50"
                        >
                          <SettingsIcon className="w-3.5 h-3.5 text-zinc-400" />
                          Settings
                        </Link>
                        <button 
                          onClick={() => {
                            setProfileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-red-650 hover:bg-red-50/50 flex items-center gap-2 cursor-pointer transition-colors border-t border-zinc-100 mt-1"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-500" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-zinc-600 hover:text-zinc-900 text-sm font-bold transition-colors">Log in</Link>
                  <Link href="/signup" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white text-sm font-bold hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)] transition-all hover:-translate-y-0.5">Sign up</Link>
                </>
              )}
            </div>

            {/* Hamburger — overflow trigger on mobile, hidden on desktop */}
            <div className="flex lg:hidden items-center space-x-2">
              <button
                 onClick={() => setIsOpen(!isOpen)}
                 className="inline-flex items-center justify-center w-11 h-11 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 focus:outline-none transition-colors shrink-0"
                 aria-label="Toggle Navigation Menu"
               >
                 {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
               </button>
            </div>
          </div>
        </div>
      </nav>
   
      {/* Mobile menu */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="lg:hidden fixed inset-0 z-[9000] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Navigation Menu">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-zinc-950/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div ref={mobileMenuRef} className="relative w-full h-[100dvh] bg-white shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 pointer-events-auto">
            {/* Header: Brand & Close Trigger */}
            <div className="flex justify-between items-center px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-4 border-b border-zinc-150 shrink-0">
              <Link href="/" className="flex items-center space-x-2.5 text-zinc-900" onClick={() => setIsOpen(false)}>
                <PrizomLogo size={36} />
                <PrizomWordmark height={20} />
                <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[8px] font-extrabold uppercase tracking-wider select-none leading-none border border-zinc-250/30 align-middle">
                  Beta
                </span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 focus:outline-none transition-colors shrink-0"
                aria-label="Close Navigation Menu"
              >
                <X className="block h-6 w-6" />
              </button>
            </div>

            {/* Scrollable middle container (Nav list) */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Overflow Navigation links */}
              <div className="space-y-2">
                {user ? (
                  <>
                    <Link 
                      href="/trending" 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <TrendingUp className="w-5 h-5 text-zinc-400" />
                      Trending
                    </Link>

                    <Link 
                      href={profile?.username ? `/creator/${profile.username}?tab=collections` : '/profile'} 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <Bookmark className="w-5 h-5 text-zinc-400" />
                      Collections
                    </Link>

                    {((profile && ['super_admin', 'admin', 'moderator'].includes(profile.role)) || 
                      (user && ['super_admin', 'admin', 'moderator'].includes(user.user_metadata?.role))) && (
                      <Link 
                        href="/admin" 
                        onClick={() => setIsOpen(false)} 
                        className="px-4 py-3 rounded-xl text-base font-bold text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-3 cursor-pointer"
                      >
                        <Terminal className="w-5 h-5 text-purple-400" />
                        Admin Panel
                      </Link>
                    )}

                    <Link 
                      href="/settings" 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer border-t border-zinc-100/50 pt-4 mt-2"
                    >
                      <SettingsIcon className="w-5 h-5 text-zinc-400" />
                      Settings
                    </Link>

                    <Link 
                      href="/settings?tab=help" 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <HelpCircle className="w-5 h-5 text-zinc-400" />
                      Help Center
                    </Link>

                    <Link 
                      href="/settings?tab=about" 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <Info className="w-5 h-5 text-zinc-400" />
                      About Prizom
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/discover" 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <Compass className="w-5 h-5 text-zinc-400" />
                      Discover
                    </Link>

                    <Link 
                      href="/trending" 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <TrendingUp className="w-5 h-5 text-zinc-400" />
                      Trending
                    </Link>

                    <Link 
                      href="/terms" 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer border-t border-zinc-100/50 pt-4 mt-2"
                    >
                      <FileText className="w-5 h-5 text-zinc-400" />
                      Terms of Service
                    </Link>

                    <Link 
                      href="/privacy" 
                      onClick={() => setIsOpen(false)} 
                      className="px-4 py-3 rounded-xl text-base font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <Info className="w-5 h-5 text-zinc-400" />
                      Privacy Policy
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="mt-auto px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border-t border-zinc-100 bg-zinc-50/50 shrink-0">
              {user ? (
                <button onClick={() => { setIsOpen(false); handleLogout(); }} className="w-full text-center block px-4 py-3 rounded-xl text-base font-bold text-red-500 hover:bg-red-50 transition-all border border-red-200/40 cursor-pointer">Log Out</button>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-zinc-700 border border-zinc-200 hover:bg-zinc-50 transition-all">Log in</Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] transition-all">Sign up</Link>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────────────── */}
      {/* Visible below md (768px) for ALL users (guests + logged in). Contextual items by auth state. */}
      {mounted && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-[90] flex items-stretch bg-white/80 backdrop-blur-md border-t border-zinc-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          role="navigation"
          aria-label="Mobile Bottom Navigation"
        >
          {(user ? [
            {
              href: '/',
              label: 'Home',
              icon: Home,
              match: (p: string) => p === '/',
            },
            {
              label: 'Search',
              icon: SearchIcon,
              onClick: (e: any) => {
                e.preventDefault();
                window.dispatchEvent(new Event('open-prizom-search'));
              },
              match: () => false,
            },
            {
              href: '/create',
              label: 'Create',
              icon: Plus,
              match: (p: string) => p === '/create',
            },
            {
              href: '/notifications',
              label: 'Notifications',
              icon: Bell,
              match: (p: string) => p.startsWith('/notifications'),
            },
            {
              href: '/profile',
              label: 'Profile',
              icon: User2,
              match: (p: string) => p.startsWith('/profile') || (profile?.username && p.startsWith(`/creator/${profile.username}`)),
            },
          ] : [
            {
              href: '/',
              label: 'Home',
              icon: Home,
              match: (p: string) => p === '/',
            },
            {
              label: 'Search',
              icon: SearchIcon,
              onClick: (e: any) => {
                e.preventDefault();
                window.dispatchEvent(new Event('open-prizom-search'));
              },
              match: () => false,
            },
            {
              href: '/discover',
              label: 'Discover',
              icon: Compass,
              match: (p: string) => p.startsWith('/discover'),
            },
            {
              href: '/trending',
              label: 'Trending',
              icon: TrendingUp,
              match: (p: string) => p.startsWith('/trending'),
            },
            {
              href: '/login',
              label: 'Log In',
              icon: UserIcon,
              match: (p: string) => p.startsWith('/login') || p.startsWith('/signup'),
            },
          ]).map(({ href, label, icon: Icon, match, onClick }: any) => {
            const isActive = pathname ? match(pathname) : false;
            const content = (
              <>
                <span className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                  isActive ? 'bg-[var(--color-neon-purple)]/10' : ''
                }`}>
                  <Icon className={`h-5 w-5 transition-all ${
                    isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                  }`} />
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 text-white font-extrabold text-[8px] flex items-center justify-center px-0.5 rounded-full border border-white animate-in scale-in duration-300">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-bold leading-none tracking-wide ${
                  isActive ? 'opacity-100' : 'opacity-70'
                }`}>
                  {label}
                </span>
              </>
            );

            const className = `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors ${
              isActive
                ? 'text-[var(--color-neon-purple)]'
                : 'text-zinc-400 hover:text-zinc-700'
            }`;

            if (onClick) {
              return (
                <button
                  key={label}
                  onClick={onClick}
                  className={className}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  type="button"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={label}
                href={href || '/'}
                className={className}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
