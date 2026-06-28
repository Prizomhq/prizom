'use client';

import { useState } from 'react';
import FollowListModal from '@/components/ui/FollowListModal';

interface CreatorStatsProps {
  userId: string;
  creatorName: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isLoggedIn: boolean;
  currentUserId: string | null;
}

export default function CreatorStats({
  userId,
  creatorName,
  postCount,
  followerCount,
  followingCount,
  isLoggedIn,
  currentUserId
}: CreatorStatsProps) {
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);

  const openFollowers = () => setModalType('followers');
  const openFollowing = () => setModalType('following');
  const closeModal = () => setModalType(null);

  return (
    <>
      <div className="flex items-center justify-center md:justify-start space-x-8 mb-6 border-b border-zinc-200/50 pb-6">
        <div className="text-center md:text-left">
          <span className="block text-xl font-black text-zinc-900">{postCount}</span>
          <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Prompts</span>
        </div>
        
        <button 
          onClick={openFollowers}
          className="text-center md:text-left hover:text-[var(--color-neon-purple)] transition-colors cursor-pointer focus:outline-none"
        >
          <span className="block text-xl font-black text-zinc-900">{followerCount}</span>
          <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Followers</span>
        </button>
        
        <button 
          onClick={openFollowing}
          className="text-center md:text-left hover:text-[var(--color-neon-purple)] transition-colors cursor-pointer focus:outline-none"
        >
          <span className="block text-xl font-black text-zinc-900">{followingCount}</span>
          <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Following</span>
        </button>
      </div>

      <FollowListModal
        isOpen={modalType !== null}
        onClose={closeModal}
        userId={userId}
        type={modalType || 'followers'}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        creatorName={creatorName}
      />
    </>
  );
}
