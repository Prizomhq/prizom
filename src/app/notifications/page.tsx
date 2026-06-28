'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  Bell, 
  RefreshCw, 
  CheckCheck, 
  Inbox, 
  Zap, 
  Heart, 
  Bookmark, 
  UserPlus, 
  Trophy, 
  ShieldAlert, 
  BadgeCheck, 
  AlertTriangle, 
  Sparkles, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  NotificationItem 
} from '@/app/actions/notifications';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Fetch logged-in user profile username for achievement routing
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (data) setProfileUsername(data.username);
    };
    fetchProfile();
  }, [supabase, router]);

  // Fetch initial notifications and counts on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
        const list = await getNotifications();
        setNotifications(list);

        // Automatically mark all as read when opening notifications page
        if (count > 0) {
          await markAllNotificationsAsRead();
          setUnreadCount(0);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleMarkAllRead = () => {
    // Optimistic UI update
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    startTransition(async () => {
      await markAllNotificationsAsRead();
    });
  };

  // Helper for relative timestamps
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleItemClick = (e: React.MouseEvent, item: NotificationItem) => {
    // If the click occurred inside an <a> tag, do not intercept
    if ((e.target as HTMLElement).closest('a')) return;

    // Optimistically mark as read on the client
    if (!item.isRead) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Dispatch server action asynchronously
      startTransition(async () => {
        await markNotificationAsRead(item.id);
      });
    }

    if (item.type === 'follow' && item.actor?.username) {
      router.push(`/creator/${item.actor.username}`);
    } else if ((item.type === 'like' || item.type === 'save' || item.type === 'remix') && item.entityId) {
      router.push(`/prompt/${item.entityId}`);
    } else if (item.type === 'achievement' && profileUsername) {
      router.push(`/creator/${profileUsername}`);
    } else if (item.type === 'verification' && profileUsername) {
      router.push(`/creator/${profileUsername}`);
    }
  };

  // Icon mapping helper based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />;
      case 'save':
        return <Bookmark className="w-3.5 h-3.5 text-[var(--color-electric-blue)] fill-current" />;
      case 'remix':
        return <Zap className="w-3.5 h-3.5 text-[var(--color-neon-purple)] fill-current" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-blue-500 fill-current" />;
      case 'achievement':
        return <Trophy className="w-3.5 h-3.5 text-amber-500 fill-current" />;
      case 'verification':
        return <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 fill-current" />;
      case 'moderation':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-500 fill-current" />;
      case 'report':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-500 fill-current" />;
      default:
        return null;
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'achievement':
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] border-l-4 border-l-amber-500 hover:border-l-amber-600',
          bg: 'bg-amber-500/[0.04]',
          avatarBg: 'bg-gradient-to-tr from-amber-400 to-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.3)]',
          avatarEmoji: '🏆'
        };
      case 'verification':
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] border-l-4 border-l-emerald-500 hover:border-l-emerald-600',
          bg: 'bg-emerald-500/[0.04]',
          avatarBg: 'bg-gradient-to-tr from-emerald-400 to-teal-600 shadow-[0_4px_12px_rgba(16,185,129,0.3)]',
          avatarEmoji: '✨'
        };
      case 'moderation':
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] border-l-4 border-l-red-500 hover:border-l-red-600',
          bg: 'bg-red-500/[0.04]',
          avatarBg: 'bg-gradient-to-tr from-red-500 to-rose-750 shadow-[0_4px_12px_rgba(239,68,68,0.3)]',
          avatarEmoji: '🛡️'
        };
      case 'report':
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] border-l-4 border-l-orange-500 hover:border-l-orange-600',
          bg: 'bg-orange-500/[0.04]',
          avatarBg: 'bg-gradient-to-tr from-orange-400 to-amber-600 shadow-[0_4px_12px_rgba(249,115,22,0.3)]',
          avatarEmoji: '🚨'
        };
      case 'follow':
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] border-l-4 border-l-blue-500 hover:border-l-blue-600',
          bg: 'bg-blue-500/[0.04]',
          avatarBg: 'bg-gradient-to-tr from-blue-400 to-indigo-600 shadow-[0_4px_12px_rgba(59,130,246,0.2)]',
          avatarEmoji: '👤'
        };
      case 'remix':
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] border-l-4 border-l-purple-500 hover:border-l-purple-600',
          bg: 'bg-purple-500/[0.04]',
          avatarBg: 'bg-gradient-to-tr from-purple-400 to-indigo-600 shadow-[0_4px_12px_rgba(168,85,247,0.2)]',
          avatarEmoji: '🔁'
        };
      case 'like':
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(236,72,153,0.15)] border-l-4 border-l-pink-500 hover:border-l-pink-600',
          bg: 'bg-pink-500/[0.04]',
          avatarBg: 'bg-gradient-to-tr from-pink-400 to-rose-600 shadow-[0_4px_12px_rgba(236,72,153,0.2)]',
          avatarEmoji: '❤️'
        };
      case 'save':
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] border-l-4 border-l-sky-500 hover:border-l-sky-600',
          bg: 'bg-sky-500/[0.04]',
          avatarBg: 'bg-gradient-to-tr from-sky-400 to-blue-600 shadow-[0_4px_12px_rgba(14,165,233,0.2)]',
          avatarEmoji: '📁'
        };
      default:
        return {
          glow: 'hover:shadow-[0_0_15px_rgba(161,161,170,0.15)] border-l-4 border-l-zinc-400 hover:border-l-zinc-500',
          bg: 'bg-zinc-500/[0.04]',
          avatarBg: 'bg-zinc-500',
          avatarEmoji: '🔔'
        };
    }
  };

  return (
    <div className="min-h-screen pb-6 md:pb-20 bg-[#fcfcfc] relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[var(--color-electric-blue)]/5 via-[var(--color-neon-purple)]/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back navigation & Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2.5 rounded-full border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 transition-colors shadow-sm cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-neon-purple" />
              Notifications
            </h1>
          </div>

          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-250 bg-white text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-black uppercase tracking-wider rounded-full shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Read All
                </>
              )}
            </button>
          )}
        </div>

        {/* Content Box */}
        <div className="bg-white border border-zinc-200/60 rounded-3xl shadow-xl overflow-hidden min-h-[400px] flex flex-col justify-start">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24">
              <Loader2 className="w-9 h-9 animate-spin text-neon-purple mb-3" />
              <p className="text-sm font-bold text-zinc-500">Loading your inbox...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex-1 py-24 px-6 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-3xl flex items-center justify-center mb-6 border border-zinc-100 shadow-inner">
                <Inbox className="w-9 h-9 text-zinc-300" />
              </div>
              <h3 className="font-black text-lg text-zinc-800 mb-2">No notifications yet</h3>
              <p className="text-zinc-400 text-sm font-semibold leading-relaxed max-w-[280px] mb-8">
                Likes, follow requests, prompt remixes, and achievements will appear here when they occur.
              </p>
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white text-xs font-black uppercase tracking-wider rounded-full shadow-sm hover:shadow-[0_8px_20px_rgba(168,85,247,0.35)] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Discover Trending Prompts
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {notifications.map((item) => {
                const styles = getNotificationStyles(item.type);
                const isSystemType = ['achievement', 'verification', 'moderation', 'report'].includes(item.type);
                return (
                  <div 
                    key={item.id}
                    onClick={(e) => handleItemClick(e, item)}
                    className={`px-6 py-5 flex items-start space-x-4 hover:bg-zinc-50/70 transition-all duration-250 cursor-pointer ${styles.bg} ${styles.glow} ${!item.isRead ? 'bg-indigo-500/[0.04]' : ''}`}
                  >
                    {/* Left Column: Avatar & Action Badge */}
                    <div className="relative shrink-0">
                      {item.actor && !isSystemType ? (
                        <Link href={`/creator/${item.actor.username}`} className="block relative z-10">
                          <Avatar 
                            src={item.actor.avatarUrl} 
                            username={item.actor.username} 
                            size="md"
                            className="border border-zinc-200/80 shadow-md hover:scale-105 transition-transform"
                          />
                        </Link>
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md select-none border border-white/20 text-white ${styles.avatarBg}`}>
                          {styles.avatarEmoji}
                        </div>
                      )}
                      
                      {/* Action Icon overlay */}
                      {item.type !== 'achievement' && item.type !== 'verification' && item.type !== 'moderation' && item.type !== 'report' && (
                        <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-md border border-zinc-150 flex items-center justify-center z-20">
                          {getNotificationIcon(item.type)}
                        </div>
                      )}
                    </div>

                    {/* Middle Column: Text details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-500 leading-relaxed break-words">
                        {item.actor && !isSystemType && (
                          <Link 
                            href={`/creator/${item.actor.username}`} 
                            className="font-black text-zinc-900 hover:text-indigo-600 transition-colors mr-1"
                          >
                            @{item.actor.username}
                          </Link>
                        )}
                        <span className="text-zinc-800 font-bold">{item.text}</span>
                      </p>
                      <span className="block text-[10.5px] text-zinc-400 font-bold mt-1.5 tracking-wider uppercase">
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    {/* Right Column: Unread Indicator Dot */}
                    {!item.isRead && (
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 self-center shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
