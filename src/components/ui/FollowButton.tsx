'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toggleFollow, checkIsFollowing } from '@/app/actions/follows';
import LoginRequiredModal from '@/components/ui/LoginRequiredModal';

interface FollowButtonProps {
  targetId: string;
  targetUsername?: string;
  initialIsFollowing?: boolean;
  isLoggedIn: boolean;
}

export default function FollowButton({ targetId, targetUsername, initialIsFollowing, isLoggedIn }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);

  // Fetch follow status automatically if not provided and user is logged in
  useEffect(() => {
    if (initialIsFollowing === undefined && isLoggedIn) {
      setIsLoading(true);
      checkIsFollowing(targetId)
        .then(res => setIsFollowing(res))
        .finally(() => setIsLoading(false));
    }
  }, [targetId, initialIsFollowing, isLoggedIn]);

  // Check for auto-follow pending intent from sessionStorage after fresh authentication
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const stored = sessionStorage.getItem('prizom_pending_intent');
      if (stored) {
        const intent = JSON.parse(stored);
        if (intent.action === 'follow' && intent.targetId === targetId) {
          const isRecent = Date.now() - (intent.timestamp || 0) < 10 * 60 * 1000;
          if (isRecent) {
            sessionStorage.removeItem('prizom_pending_intent');
            setIsLoading(true);
            setIsFollowing(true);
            toggleFollow(targetId, false)
              .catch(() => setIsFollowing(false))
              .finally(() => setIsLoading(false));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse pending follow intent:', e);
    }
  }, [isLoggedIn, targetId]);

  const handleFollowClick = async () => {
    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }

    setIsLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing); // Optimistic

    const res = await toggleFollow(targetId, wasFollowing);
    
    if (!res.success) {
      setIsFollowing(wasFollowing); // Revert on failure
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={handleFollowClick}
        disabled={isLoading}
        className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center min-w-[110px] sm:min-w-[130px] shadow-sm group shrink-0 cursor-pointer
          ${isFollowing 
            ? 'bg-zinc-100 text-zinc-900 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent' 
            : 'bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)] hover:-translate-y-0.5'
          }
        `}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserCheck className="w-4 h-4 mr-2" />
            <span className="group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline text-red-600">Unfollow</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Follow
          </>
        )}
      </button>

      <LoginRequiredModal 
        isOpen={isLoginRequiredOpen}
        onClose={() => setIsLoginRequiredOpen(false)}
        intentAction="follow"
        targetCreatorId={targetId}
        targetUsername={targetUsername}
        title={`Follow @${targetUsername || 'Creator'}`}
        description={`Sign up or log in to Prizom to follow @${targetUsername || 'this creator'} and build your personalized prompt feed.`}
      />
    </>
  );
}
