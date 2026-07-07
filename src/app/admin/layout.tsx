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
  Bell,
  Home,
  Mail,
  Tags,
  Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PrizomLogo from '@/components/ui/PrizomLogo';
import { getOptimizedImageUrl } from '@/lib/cloudinary-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center text-zinc-600">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-neon-purple)]" />
          <span className="text-xs font-black uppercase tracking-widest">Validating Clearance...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin', 'moderator']
    },
    {
      label: 'Users',
      path: '/admin/users',
      icon: Users,
      roles: ['super_admin', 'admin']
    },
    {
      label: 'Lifecycle',
      path: '/admin/lifecycle',
      icon: Clock,
      roles: ['super_admin', 'admin']
    },
    {
      label: 'Prompts',
      path: '/admin/prompts',
      icon: FileText,
      roles: ['super_admin', 'admin', 'moderator']
    },
    {
      label: 'Reports',
      path: '/admin/reports',
      icon: ShieldAlert,
      roles: ['super_admin', 'admin', 'moderator']
    },
    {
      label: 'Messages',
      path: '/admin/messages',
      icon: Mail,
      roles: ['super_admin', 'admin', 'moderator']
    },
    {
      label: 'Content Management',
      path: '/admin/content?tab=homepage',
      icon: Home,
      roles: ['super_admin', 'admin']
    },
    {
      label: 'Settings',
      path: '/admin/content?tab=team',
      icon: Settings,
      roles: ['super_admin']
    }
  ];

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    moderator: 'Moderator'
  };

  const roleColors: Record<string, string> = {
    super_admin: 'text-red-400 bg-red-950/40 border-red-900/40',
    admin: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/40',
    moderator: 'text-teal-400 bg-teal-950/40 border-teal-900/40'
  };

  const filteredNav = navItems.filter(item => item.roles.includes(adminUser.role));

  return (
    <div className="h-screen overflow-hidden bg-[#fcfcfc] text-zinc-800 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 shrink-0 z-40 relative">
        <Link href="/admin" className="flex items-center space-x-2.5">
          <PrizomLogo size={36} />
          <span className="font-black text-lg tracking-tight text-zinc-900">Prizom Admin</span>
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
          className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-30 pointer-events-auto transition-opacity" 
        />
      )}

      {/* Admin Panel Sidebar Shell */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 w-64 h-full bg-white border-r border-zinc-200 z-35 flex flex-col justify-between shrink-0 p-6 transition-transform duration-300 backdrop-blur-xl md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col space-y-8 overflow-y-auto no-scrollbar flex-1 mb-6">
          {/* Logo & Header */}
          <Link href="/admin" className="hidden md:flex items-center space-x-3 w-fit group">
            <PrizomLogo size={40} className="transition-transform group-hover:scale-105 duration-300" />
            <span className="font-black text-xl tracking-tight text-zinc-900">
              Prizom
            </span>
            <span className="text-[9px] font-black tracking-widest text-zinc-550 uppercase">ctrl</span>
          </Link>

          {/* Admin Info Badge */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3 animate-in fade-in duration-200">
            {adminUser.avatarUrl ? (
              <img 
                src={getOptimizedImageUrl(adminUser.avatarUrl, 'avatar')} 
                alt={adminUser.username || 'Admin'}
                className="w-9 h-9 object-cover rounded-xl bg-zinc-100 animate-in zoom-in-95 duration-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-zinc-200 flex items-center justify-center text-xs font-black uppercase text-zinc-650 animate-in zoom-in-95 duration-200">
                {adminUser.username?.[0] || adminUser.email?.[0] || 'A'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-zinc-800 truncate">{adminUser.username || 'System Node'}</p>
              <span className={`inline-flex px-2 py-0.5 mt-1 border rounded-md text-[9px] font-black uppercase tracking-wider ${roleColors[adminUser.role]}`}>
                {roleLabels[adminUser.role]}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1.5 pb-8">
            {filteredNav.map((item, i) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (
                pathname === '/admin/content' && item.path.includes(`tab=${new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tab') || 'homepage'}`)
              );
              return (
                <Link
                  key={i}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 group/nav
                    ${isActive 
                      ? 'bg-[var(--color-neon-purple)] text-white shadow-md' 
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'}
                  `}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-zinc-500 group-hover/nav:text-zinc-700 transition-colors'}`} />
                    {item.label}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover/nav:opacity-100 transition-opacity ${isActive ? 'text-white' : 'text-zinc-650'}`} />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions - Bottom Locked */}
        <div className="space-y-4 pt-6 border-t border-zinc-200 shrink-0">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 text-xs font-black uppercase tracking-wider transition-all duration-200"
          >
            <Activity className="w-4 h-4 text-[var(--color-electric-blue)]" />
            Return to Main Site
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-50 hover:bg-red-50 border border-zinc-200 hover:border-red-200 text-zinc-600 hover:text-red-650 text-xs font-black uppercase tracking-wider transition-all duration-200"
          >
            <span className="flex items-center gap-3">
              <LogOut className="w-4.5 h-4.5" />
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace Area - Independently Scrollable */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
