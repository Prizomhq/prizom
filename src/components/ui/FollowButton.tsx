'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toggleFollow, checkIsFollowing } from '@/app/actions/follows';
import LoginRequiredModal from '@/components/ui/LoginRequiredModal';

interface FollowButtonProps {
  targetId: string;
  initialIsFollowing?: boolean;
  isLoggedIn: boolean;
}

export default function FollowButton({ targetId, initialIsFollowing, isLoggedIn }: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);

  // Fetch follow status automatically if not provided and user is logged in
  useEffect(() => {
    if (initialIsFollowing === undefined && isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      checkIsFollowing(targetId)
        .then(res => setIsFollowing(res))
        .finally(() => setIsLoading(false));
    }
  }, [targetId, initialIsFollowing, isLoggedIn]);

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
        className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center min-w-[110px] sm:min-w-[130px] shadow-sm group shrink-0
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
      />
    </>
  );
}
