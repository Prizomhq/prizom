'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, Bookmark, Zap, MoreHorizontal, Link2, EyeOff, AlertTriangle } from 'lucide-react';
import { toggleLike, removePromptFromAllCollections } from '@/app/actions/interactions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { hidePromptUser } from '@/app/actions/hiddenActions';
import SaveModal from '@/components/ui/SaveModal';
import UnsaveModal from '@/components/ui/UnsaveModal';
import ReportModal from '@/components/ui/ReportModal';
import LoginRequiredModal from '@/components/ui/LoginRequiredModal';

interface PromptActionsProps {
  promptId: string;
  promptTitle: string;
  initialLikes: number;
  initialSaves: number;
  initialIsLiked: boolean;
  initialIsSaved: boolean;
  isLoggedIn: boolean;
  isOwner?: boolean;
}

export default function PromptActions({ 
  promptId, 
  promptTitle,
  initialLikes, 
  initialSaves, 
  initialIsLiked, 
  initialIsSaved,
  isLoggedIn,
  isOwner = false
}: PromptActionsProps) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  
  // Modal state
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isUnsaveOpen, setIsUnsaveOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);

  // Custom Actions state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Lock state
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReport = () => {
    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }
    setMenuOpen(false);
    setIsReportOpen(true);
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }
    if (isLiking) return;
    
    setIsLiking(true);
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    if (!isOwner) {
      setLikes(prev => wasLiked ? prev - 1 : prev + 1);
    }

    try {
      const res = await toggleLike(promptId, wasLiked);
      if (!res.success) {
        // Revert on failure
        setIsLiked(wasLiked);
        if (!isOwner) {
          setLikes(prev => wasLiked ? prev + 1 : prev - 1);
        }
        showToast('Error updating like.');
      }
    } catch (err) {
      console.error(err);
      setIsLiked(wasLiked);
      if (!isOwner) {
        setLikes(prev => wasLiked ? prev + 1 : prev - 1);
      }
      showToast('Error updating like.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSaveClick = () => {
    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }
    if (isSaving) return;
    
    if (isSaved) {
      setIsUnsaveOpen(true);
    } else {
      setIsSaveOpen(true);
    }
  };

  const handleUnsaveConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setIsSaved(false);
    try {
      const res = await removePromptFromAllCollections(promptId);
      if (!res.success) {
        setIsSaved(true);
        showToast('Error unsaving prompt.');
      } else {
        showToast('Removed from collections.');
      }
    } catch (err) {
      console.error(err);
      setIsSaved(true);
      showToast('Error unsaving prompt.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    setMenuOpen(false);
    const url = `${window.location.origin}/prompt/${promptId}`;
    navigator.clipboard.writeText(url);
    showToast('Copied link to clipboard!');
  };

  const handleHidePrompt = async () => {
    setMenuOpen(false);
    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }
    setIsHidden(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const res = await hidePromptUser(promptId, true);
        if (!res.success) {
          console.error('Failed to hide prompt on server:', res.error);
          showToast(res.error || 'Failed to hide prompt.');
          setIsHidden(false);
        }
      }
    } catch (err) {
      console.error('Failed to hide prompt:', err);
    }
  };

  if (isHidden) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#fcfcfc]/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white/85 border border-zinc-200/50 rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-250 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)]"></div>
          <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-400">
            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.228-2.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2">Prompt Hidden</h3>
          <p className="text-zinc-500 text-sm font-semibold mb-8 leading-relaxed">
            This prompt has been hidden and removed from your active creative feeds.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center w-full py-3.5 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg text-white font-bold rounded-full text-sm transition-all"
          >
            Go Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SaveModal
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        promptId={promptId}
        onSaveSuccess={() => setIsSaved(true)}
      />

      <UnsaveModal
        isOpen={isUnsaveOpen}
        onClose={() => setIsUnsaveOpen(false)}
        onConfirm={handleUnsaveConfirm}
      />

      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        type="prompt"
        entityId={promptId}
        entityName={promptTitle}
      />

      <LoginRequiredModal
        isOpen={isLoginRequiredOpen}
        onClose={() => setIsLoginRequiredOpen(false)}
      />

      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-xl font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        {/* Like Button */}
        <button 
          onClick={handleLike}
          className={`flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-2xl border transition-all duration-300 font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 shrink-0 ${
            isLiked 
              ? 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:shadow-red-500/20' 
              : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-red-500 hover:border-red-200'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 shrink-0 ${isLiked ? 'fill-current' : ''}`} />
          <span className="whitespace-nowrap truncate">{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
        </button>

        {/* Save Button */}
        <button 
          onClick={handleSaveClick}
          className={`flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-2xl border transition-all duration-300 font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 shrink-0 ${
            isSaved 
              ? 'bg-[var(--color-electric-blue)] border-[var(--color-electric-blue)] text-white hover:bg-blue-600 hover:shadow-blue-500/20' 
              : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-[var(--color-electric-blue)] hover:border-blue-200'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 shrink-0 ${isSaved ? 'fill-current' : ''}`} />
          <span className="whitespace-nowrap truncate">{isSaved ? 'Saved' : 'Save'}</span>
        </button>

        {/* Remix Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isLoggedIn) {
              setIsLoginRequiredOpen(true);
            } else {
              router.push(`/create?remixId=${promptId}`);
            }
          }}
          className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-2xl bg-white border border-zinc-200 hover:border-[var(--color-neon-purple)] hover:text-[var(--color-neon-purple)] text-zinc-700 transition-all duration-300 font-bold text-xs shadow-sm hover:bg-purple-50/[0.2] flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-[var(--color-neon-purple)] shrink-0 animate-pulse" />
          <span className="whitespace-nowrap truncate">Remix</span>
        </button>

        {/* Edit Button (only visible to prompt owner) */}
        {isOwner && (
          <Link
            href={`/prompt/${promptId}/edit`}
            className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-2xl bg-white border border-zinc-200 hover:border-[var(--color-electric-blue)] hover:text-[var(--color-electric-blue)] text-zinc-700 transition-all duration-300 font-bold text-xs shadow-sm hover:bg-blue-50/[0.2] flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[var(--color-electric-blue)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
            <span className="whitespace-nowrap truncate">Edit</span>
          </Link>
        )}

        {/* Divider for desktop */}
        <div className="hidden sm:block w-px h-6 bg-zinc-200 mx-2.5"></div>


        {/* 3-Dot Options Dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className={`h-10 w-10 rounded-2xl border transition-all duration-300 shadow-sm flex items-center justify-center shrink-0 ${
              menuOpen 
                ? 'bg-zinc-950 text-white border-zinc-950' 
                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-950'
            }`}
            title="Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div 
              className="absolute right-0 mt-2 w-44 bg-white/95 border border-zinc-200/50 rounded-2xl shadow-xl backdrop-blur-md py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
              >
                <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                Copy Link
              </button>
              <button
                onClick={handleHidePrompt}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-t border-zinc-100"
              >
                <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                Hide Prompt
              </button>
              <button
                onClick={handleReport}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50/50 flex items-center gap-2 border-t border-zinc-100 mt-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Flag Review
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
