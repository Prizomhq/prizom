'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Loader2, 
  Activity, 
  ChevronRight,
  Home,
  Mail,
  Clock,
  Search,
  Command
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PrizomLogo from '@/components/ui/PrizomLogo';
import { getOptimizedImageUrl } from '@/lib/cloudinary-client';
import CommandPalette from '@/components/admin/ui/CommandPalette';
import AdminStatusBadge from '@/components/admin/ui/AdminStatusBadge';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const supabase = createClient();

  const isPublicPage = pathname === '/admin/login' || 
                       pathname === '/admin/unauthorized';

  useEffect(() => {
    if (isPublicPage) return;

    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Load profile role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || !['super_admin', 'admin', 'moderator'].includes(profile.role)) {
        router.push('/admin/unauthorized');
        return;
      }

      setAdminUser({
        id: user.id,
        email: user.email,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        role: profile.role
      });
      setLoading(false);

      // Trigger moderation cleanup in the background
      fetch('/api/cron/cleanup').catch(err => console.error('[CLEANUP] Background execution error:', err));
    };

    checkSession();
  }, [router, supabase, isPublicPage]);

  // Command + K and Sequential Hotkeys listener
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore hotkeys when typing in form inputs or textareas
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();

      if (lastKey === 'g' && now - lastKeyTime < 1000) {
        if (key === 'd') {
          e.preventDefault();
          router.push('/admin');
        } else if (key === 'u') {
          e.preventDefault();
          router.push('/admin/users');
        } else if (key === 'p') {
          e.preventDefault();
          router.push('/admin/prompts');
        } else if (key === 'r') {
          e.preventDefault();
          router.push('/admin/reports');
        } else if (key === 'c') {
          e.preventDefault();
          router.push('/admin/content?tab=homepage');
        }
        lastKey = '';
        return;
      }

      if (key === 'g') {
        lastKey = 'g';
        lastKeyTime = now;
      } else {
        lastKey = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-600">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Validating Clearance...</span>
        </div>
      </div>
    );
  }

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'moderator'] }
      ]
    },
    {
      title: 'MODERATION',
      items: [
        { label: 'Reports & Appeals', path: '/admin/reports', icon: ShieldAlert, roles: ['super_admin', 'admin', 'moderator'] },
        { label: 'Prompts Catalog', path: '/admin/prompts', icon: FileText, roles: ['super_admin', 'admin', 'moderator'] },
        { label: 'User Directory', path: '/admin/users', icon: Users, roles: ['super_admin', 'admin'] }
      ]
    },
    {
      title: 'CONTENT & CMS',
      items: [
        { label: 'Content Management', path: '/admin/content?tab=homepage', icon: Home, roles: ['super_admin', 'admin'] },
        { label: 'Messages & Mail', path: '/admin/messages', icon: Mail, roles: ['super_admin', 'admin', 'moderator'] }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Account Lifecycle', path: '/admin/lifecycle', icon: Clock, roles: ['super_admin', 'admin'] },
        { label: 'Team Clearance', path: '/admin/content?tab=team', icon: Settings, roles: ['super_admin'] }
      ]
    }
  ];

  return (
    <div className="h-screen overflow-hidden bg-zinc-50/60 text-zinc-800 flex flex-col md:flex-row font-sans">
      
      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Mobile Top Navigation Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200/80 shrink-0 z-40 relative">
        <Link href="/admin" className="flex items-center space-x-2.5">
          <PrizomLogo size={36} />
          <span className="font-bold text-lg tracking-tight text-zinc-900">Prizom Admin</span>
        </Link>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Drawer Overlay for Mobile Sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-30 pointer-events-auto transition-opacity" 
        />
      )}

      {/* Enterprise Admin Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 w-64 h-full bg-white border-r border-zinc-200/80 z-35 flex flex-col justify-between shrink-0 p-5 transition-transform duration-300 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col space-y-6 overflow-y-auto no-scrollbar flex-1 mb-4">
          
          {/* Brand Header */}
          <Link href="/admin" className="hidden md:flex items-center space-x-3 w-fit group py-1">
            <PrizomLogo size={36} className="transition-transform group-hover:scale-105 duration-200" />
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-zinc-900 leading-tight">
                Prizom
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">Enterprise</span>
            </div>
          </Link>

          {/* Quick Command Bar Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/60 transition-all text-xs font-medium"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              Quick search...
            </span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-zinc-200 text-zinc-500 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Admin User Card */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-3">
            {adminUser.avatarUrl ? (
              <img 
                src={getOptimizedImageUrl(adminUser.avatarUrl, 'avatar')} 
                alt={adminUser.username || 'Admin'}
                className="w-8 h-8 object-cover rounded-lg bg-zinc-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                {adminUser.username?.[0] || adminUser.email?.[0] || 'A'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 truncate">{adminUser.username || 'System Admin'}</p>
              <AdminStatusBadge status={adminUser.role} className="mt-0.5" />
            </div>
          </div>

          {/* Sectioned Navigation Links */}
          <nav className="flex flex-col space-y-5">
            {navSections.map((sec, idx) => {
              const items = sec.items.filter(i => i.roles.includes(adminUser.role));
              if (items.length === 0) return null;

              return (
                <div key={idx} className="space-y-1">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {sec.title}
                  </span>
                  <div className="space-y-0.5 pt-1">
                    {items.map((item, i) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path || (
                        pathname?.startsWith('/admin/content') && item.path.startsWith('/admin/content')
                      );
                      return (
                        <Link
                          key={i}
                          href={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors
                            ${isActive 
                              ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                              : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-100/60'}
                          `}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-zinc-400'}`} />
                            {item.label}
                          </span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 pt-4 border-t border-zinc-200/80 shrink-0">
          <Link 
            href="/" 
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60 text-xs font-medium transition-colors"
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            Main Application
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
          >
            <LogOut className="w-4 h-4 text-zinc-400 hover:text-rose-600" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace Container */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top Operational Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-zinc-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/60 transition-all text-xs font-medium"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search control center...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 bg-white rounded border border-zinc-200 ml-2">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
