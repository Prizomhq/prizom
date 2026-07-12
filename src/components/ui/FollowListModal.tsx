'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { getFollowers, getFollowing, removeFollower, toggleFollow } from '@/app/actions/follows';
import { FollowUser } from '@/types';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  isLoggedIn: boolean;
  currentUserId: string | null;
  creatorName: string;
}

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
  currentUserId,
  creatorName
}: FollowListModalProps) {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      setError(null);
      setSearchQuery('');

      const fetchData = async () => {
        try {
          // 1. Fetch followers/following list
          const listData = type === 'followers' 
            ? await getFollowers(userId) 
            : await getFollowing(userId);
          setUsers(listData || []);

          // 2. If logged in, fetch the current user's following list to dynamically compute follow back relationships
          if (currentUserId) {
            const myFollowing = await getFollowing(currentUserId);
            setFollowingIds(new Set((myFollowing || []).map(u => u.id)));
          }
        } catch (err) {
          console.error(err);
          setError('Failed to load list. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, userId, type, currentUserId]);

  // Keyboard accessibility and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const modalElement = document.getElementById('follow-list-modal');
        if (!modalElement) return;

        const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = modalElement.querySelectorAll(focusableElementsString);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const term = searchQuery.toLowerCase();
    return (
      (user.username?.toLowerCase() || '').includes(term) ||
      (user.full_name?.toLowerCase() || '').includes(term)
    );
  });

  // Follow back or Follow click
  const handleFollowToggleInModal = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) return;

    // Optimistic state updates
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) {
        next.delete(targetUserId);
      } else {
        next.add(targetUserId);
      }
      return next;
    });

    const res = await toggleFollow(targetUserId, isCurrentlyFollowing);
    if (!res.success) {
      // Revert state
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.add(targetUserId);
        } else {
          next.delete(targetUserId);
        }
        return next;
      });
    }
  };

  // Remove Follower click
  const handleRemoveFollowerClick = async (followerId: string) => {
    if (!currentUserId) return;

    // Optimistic UI state updates
    setUsers(prev => prev.filter(u => u.id !== followerId));

    const res = await removeFollower(followerId);
    if (!res.success) {
      // Revert by re-fetching
      const listData = await getFollowers(userId);
      setUsers(listData || []);
    }
  };

  const title = type === 'followers' ? 'Followers' : 'Following';
  const isOwnProfile = currentUserId === userId;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        id="follow-list-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-list-title"
        className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[80vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div>
            <h2 id="follow-list-title" className="text-xl font-black text-zinc-900 tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-600 font-semibold mt-0.5">{creatorName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
 
        {/* Search */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-1 focus:ring-[var(--color-neon-purple)] text-sm font-bold bg-white"
              />
            </div>
          </div>
        )}
 
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] min-h-[300px] flex flex-col">
          {loading ? (
            // PREMIUM LOADING SKELETONS
            <div className="space-y-5">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-zinc-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-zinc-200 rounded" />
                    <div className="h-2 w-16 bg-zinc-100 rounded" />
                  </div>
                  <div className="h-8 w-20 bg-zinc-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <p className="text-red-500 font-bold text-sm mb-4">{error}</p>
              <button 
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  if (type === 'followers') {
                    getFollowers(userId).then(setUsers).finally(() => setLoading(false));
                  } else {
                    getFollowing(userId).then(setUsers).finally(() => setLoading(false));
                  }
                }}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-black transition-colors text-xs font-bold text-white rounded-xl"
              >
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <p className="text-zinc-500 font-bold">
                {searchQuery ? 'No matching users found' : `No ${type} yet`}
              </p>
              <p className="text-xs text-zinc-600 mt-1 max-w-[220px]">
                {searchQuery ? 'Try typing a different name.' : `Follower metrics sync instantly.`}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredUsers.map((userItem) => {
                const isSelf = currentUserId === userItem.id;
                const isAmFollowing = followingIds.has(userItem.id);
 
                return (
                  <div key={userItem.id} className="flex items-start justify-between py-1 gap-3">
                    <Link 
                      href={`/creator/${userItem.username}`}
                      onClick={onClose}
                      className="flex items-start space-x-3 flex-1 min-w-0 group"
                    >
                      <Avatar 
                        src={userItem.avatar_url} 
                        username={userItem.username} 
                        size="md"
                        className="group-hover:opacity-85 transition-opacity mt-0.5 border border-zinc-200/50" 
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-[14px] text-zinc-900 truncate leading-tight group-hover:text-[var(--color-neon-purple)] transition-colors">
                          {userItem.full_name || userItem.username}
                        </span>
                        <span className="text-xs text-zinc-650 font-bold truncate leading-tight mt-0.5">
                          @{userItem.username}
                        </span>
                        {userItem.bio && (
                          <p className="text-[11px] text-zinc-500 font-medium line-clamp-1 mt-1 leading-normal">
                            {userItem.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                    
                    {!isSelf && currentUserId && (
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {/* 1. Main Follow/Unfollow/Follow Back button */}
                        {isOwnProfile && type === 'followers' ? (
                           <button
                             onClick={() => handleFollowToggleInModal(userItem.id, isAmFollowing)}
                             className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                               isAmFollowing 
                                 ? 'bg-zinc-100 text-zinc-800 border border-zinc-200 hover:bg-zinc-200' 
                                 : 'bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white hover:shadow-md'
                             }`}
                           >
                             {isAmFollowing ? 'Following' : 'Follow Back'}
                           </button>
                        ) : (
                           <button
                             onClick={() => handleFollowToggleInModal(userItem.id, isAmFollowing)}
                             className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                               isAmFollowing 
                                 ? 'bg-zinc-100 text-zinc-800 border border-zinc-200 hover:bg-zinc-200' 
                                 : 'bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white hover:shadow-md'
                             }`}
                           >
                             {isAmFollowing ? 'Following' : 'Follow'}
                           </button>
                        )}

                        {/* 2. Remove follower action (only displayed under followers tab on own profile) */}
                        {isOwnProfile && type === 'followers' && (
                          <button
                            onClick={() => handleRemoveFollowerClick(userItem.id)}
                            className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider py-1 px-2 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        )}
                      </div>
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

  return createPortal(modalContent, document.body);
}
