'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, AlertTriangle, Slash, Link2, EyeOff, Activity } from 'lucide-react';
import FollowButton from '@/components/ui/FollowButton';
import ReportModal from '@/components/ui/ReportModal';
import LoginRequiredModal from '@/components/ui/LoginRequiredModal';
import DynamicDialog from '@/components/ui/DynamicDialog';
import { blockUser } from '@/app/actions/moderation';

interface CreatorProfileActionsProps {
  creatorId: string;
  creatorName: string;
  isLoggedIn: boolean;
  isOwnProfile: boolean;
  initialIsFollowing: boolean;
}

export default function CreatorProfileActions({
  creatorId,
  creatorName,
  isLoggedIn,
  isOwnProfile,
  initialIsFollowing
}: CreatorProfileActionsProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBlockUser = () => {
    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }

    setMenuOpen(false);
    setIsBlockConfirmOpen(true);
  };

  const executeBlockUser = async () => {
    startTransition(async () => {
      const res = await blockUser(creatorId);
      if (res.success) {
        showToast(`Successfully blocked @${creatorName}`);
        router.refresh();
      } else {
        showToast(res.error || 'Failed to block user.');
      }
    });
  };

  const handleReportUser = () => {
    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }
    setMenuOpen(false);
    setIsReportOpen(true);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    const url = `${window.location.origin}/creator/${creatorName}`;
    navigator.clipboard.writeText(url);
    showToast('Copied profile link to clipboard!');
  };

  return (
    <>
      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        type="creator"
        entityId={creatorId}
        entityName={creatorName}
      />
      <LoginRequiredModal
        isOpen={isLoginRequiredOpen}
        onClose={() => setIsLoginRequiredOpen(false)}
      />
      <DynamicDialog
        isOpen={isBlockConfirmOpen}
        onClose={() => setIsBlockConfirmOpen(false)}
        title="Block User"
        description={`Are you sure you want to block @${creatorName}? This will prevent them from subscribing to you, seeing your prompts, or interacting with your profile.`}
        type="danger"
        confirmLabel="Block"
        cancelLabel="Cancel"
        onConfirm={executeBlockUser}
      />

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] bg-zinc-900 text-white px-6 py-3 rounded-full shadow-xl font-medium text-sm animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
          {toastMessage}
        </div>
      )}

      <div className="flex items-center space-x-3">
        {isOwnProfile ? (
          <div className="flex items-center space-x-3">
            <Link href="/create" className="h-11 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold transition-all text-xs border border-zinc-200 shadow-sm flex items-center justify-center">
              Create Prompt
            </Link>
            <Link href="/settings" className="h-11 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold transition-all text-xs border border-zinc-200 shadow-sm flex items-center justify-center">
              Edit Profile
            </Link>

            {/* 3-Dot for own profile */}
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-950 border border-zinc-200 shadow-sm transition-all shrink-0"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white/95 border border-zinc-200/50 rounded-2xl shadow-xl backdrop-blur-md py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                     onMouseLeave={() => setMenuOpen(false)}>
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                  >
                    <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                    Copy Profile Link
                  </button>
                  <Link
                    href="/profile/hidden"
                    className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-t border-zinc-100"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                    Hidden Prompts
                  </Link>
                  <Link
                    href={`/creator/${creatorName}/analytics`}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-t border-zinc-100"
                  >
                    <Activity className="w-3.5 h-3.5 text-zinc-400" />
                    Creator Analytics
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <FollowButton 
              targetId={creatorId} 
              initialIsFollowing={initialIsFollowing} 
              isLoggedIn={isLoggedIn} 
            />

            {/* 3-Dot Action Menu Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                disabled={isPending}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-950 border border-zinc-200 shadow-sm transition-all shrink-0"
                title="Options"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <MoreHorizontal className="w-4 h-4" />
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white/95 border border-zinc-200/50 rounded-2xl shadow-xl backdrop-blur-md py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                     onMouseLeave={() => setMenuOpen(false)}>
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                  >
                    <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                    Copy Profile Link
                  </button>
                  <button
                    onClick={handleReportUser}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-t border-zinc-100 mt-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />
                    Report User
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50/50 flex items-center gap-2 border-t border-zinc-100 mt-1"
                  >
                    <Slash className="w-3.5 h-3.5 text-red-500" />
                    Block User
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
