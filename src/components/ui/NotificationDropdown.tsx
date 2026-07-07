'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Bell, RefreshCw, CheckCheck, Inbox, Zap, Heart, Bookmark, UserPlus, Trophy, ShieldAlert, BadgeCheck, AlertTriangle } from 'lucide-react';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead, NotificationItem } from '@/app/actions/notifications';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NotificationDropdown() {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch logged-in user profile username for achievement routing
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (data) setProfileUsername(data.username);
      }
    };
    fetchProfile();
  }, [supabase]);

  // Fetch initial counts and notifications on mount & subscribe to realtime updates
  useEffect(() => {
    const fetchData = async () => {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);

      if (isOpen) {
        const list = await getNotifications();
        setNotifications(list);
      }
    };
    fetchData();

    if (!userId) return;

    // Subscribe to realtime notification updates for this user (P1-3)
    const channel = supabase
      .channel(`dropdown-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, userId, supabase]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

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

    setIsOpen(false);

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
        return <Heart className="w-3 h-3 text-rose-500 fill-current" />;
      case 'save':
        return <Bookmark className="w-3 h-3 text-[var(--color-electric-blue)] fill-current" />;
      case 'remix':
        return <Zap className="w-3 h-3 text-[var(--color-neon-purple)] fill-current" />;
      case 'follow':
        return <UserPlus className="w-3 h-3 text-blue-500 fill-current" />;
      case 'achievement':
        return <Trophy className="w-3 h-3 text-amber-500 fill-current" />;
      case 'verification':
        return <BadgeCheck className="w-3 h-3 text-emerald-500 fill-current" />;
      case 'moderation':
        return <ShieldAlert className="w-3 h-3 text-red-500 fill-current" />;
      case 'report':
        return <AlertTriangle className="w-3 h-3 text-orange-500 fill-current" />;
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
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Icon */}
      <button 
        onClick={handleToggle}
        className={`w-11 h-11 rounded-full border transition-all duration-300 relative shadow-sm shrink-0 flex items-center justify-center ${
          isOpen 
            ? 'bg-zinc-950 text-white border-zinc-950' 
            : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-950'
        }`}
      >
        <Bell className="h-4 w-4" />
        
        {/* Red Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center px-1 rounded-full border-2 border-white animate-in scale-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-[110%] left-4 right-4 sm:left-auto sm:right-0 mt-3 sm:mt-1.5 w-auto sm:w-96 bg-white/95 border border-zinc-200/60 rounded-3xl shadow-2xl backdrop-blur-xl z-50 py-4 flex flex-col max-h-[480px] overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Header */}
          <div className="px-5 pb-3 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-black text-zinc-900 tracking-tight">Activity Feed</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-wider">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest flex items-center gap-1 disabled:opacity-50 py-3.5 -my-3.5 px-2 -mx-2 relative after:content-[''] after:absolute after:-inset-1"
              >
                {isPending ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" />
                    Read All
                  </>
                )}
              </button>
            )}
          </div>

          {/* List Wrapper */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100/50 pr-1">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl flex items-center justify-center mb-4 border border-zinc-100 shadow-inner">
                  <Inbox className="w-7 h-7 text-zinc-300" />
                </div>
                <h4 className="font-black text-sm text-zinc-800 mb-1">All caught up!</h4>
                <p className="text-zinc-400 text-xs font-semibold leading-relaxed max-w-[200px] mb-5">
                  Follows, likes, remixes and achievements will appear here.
                </p>
                <Link
                  href="/trending"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-black text-[var(--color-neon-purple)] hover:underline flex items-center gap-1 transition-colors"
                >
                  Browse Trending Prompts
                </Link>
              </div>
            ) : (
              notifications.map((item) => {
                const styles = getNotificationStyles(item.type);
                const isSystemType = ['achievement', 'verification', 'moderation', 'report'].includes(item.type);
                return (
                  <div 
                    key={item.id}
                    onClick={(e) => handleItemClick(e, item)}
                    className={`px-5 py-4 flex items-start space-x-3.5 border-b border-zinc-100/50 hover:bg-zinc-50/80 transition-all duration-300 cursor-pointer ${styles.bg} ${styles.glow} ${!item.isRead ? 'bg-indigo-500/[0.06]' : ''}`}
                  >
                    {/* Left Column: Avatar & Action Badge */}
                    <div className="relative shrink-0">
                      {item.actor && !isSystemType ? (
                        <Link href={`/creator/${item.actor.username}`} onClick={() => setIsOpen(false)} className="block p-1.5 -m-1.5">
                          <Avatar 
                            src={item.actor.avatarUrl} 
                            username={item.actor.username} 
                            size="sm"
                            className="border border-zinc-150 shadow-sm hover:scale-105 transition-transform"
                          />
                        </Link>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md select-none border border-white/25 text-white ${styles.avatarBg}`}>
                          {styles.avatarEmoji}
                        </div>
                      )}
                      
                      {/* Action Icon overlay */}
                      {item.type !== 'achievement' && item.type !== 'verification' && item.type !== 'moderation' && item.type !== 'report' && (
                        <div className="absolute -bottom-1.5 -right-1.5 p-1 bg-white rounded-full shadow-md border border-zinc-100 flex items-center justify-center">
                          {getNotificationIcon(item.type)}
                        </div>
                      )}
                    </div>

                    {/* Middle Column: Text details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-500 leading-relaxed break-words">
                        {item.actor && !isSystemType && (
                          <Link 
                            href={`/creator/${item.actor.username}`} 
                            onClick={() => setIsOpen(false)}
                            className="font-black text-zinc-900 hover:text-indigo-600 transition-colors mr-1"
                          >
                            @{item.actor.username}
                          </Link>
                        )}
                        <span className="text-zinc-800 font-bold">{item.text}</span>
                      </p>
                      <span className="block text-[10px] text-zinc-400 font-bold mt-1 tracking-wider uppercase">
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    {/* Right Column: Unread Indicator Dot */}
                    {!item.isRead && (
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 self-center shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
