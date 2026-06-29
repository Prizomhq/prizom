'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, MoreHorizontal, Link2, EyeOff, AlertTriangle, BadgeCheck, Zap, Sparkles, GitFork, Copy } from 'lucide-react';
import { toggleLike, removePromptFromAllCollections, checkInteractionStatus } from '@/app/actions/interactions';
import { createClient } from '@/lib/supabase/client';
import { hidePromptUser } from '@/app/actions/hiddenActions';
import SaveModal from '@/components/ui/SaveModal';
import UnsaveModal from '@/components/ui/UnsaveModal';
import ReportModal from '@/components/ui/ReportModal';
import LoginRequiredModal from '@/components/ui/LoginRequiredModal';
import { getOptimizedImageUrl, getAspectRatioStyle, getTrueAspectRatioStyle } from '@/lib/cloudinary-client';
import ProgressiveImage from '@/components/ui/ProgressiveImage';
import Avatar from '@/components/ui/Avatar';

interface PromptCardProps {
  id: string;
  title: string;
  imageUrl: string;
  tool: string;
  creator: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
    badges?: string[];
  };
  likes: number;
  saves: number;
  description?: string;
  tags?: string[];
  promptText?: string; // Kept for backwards compatibility but not used
  remixOf?: string | null;
  remixCount?: number;
  aspectRatio?: string;
  category?: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
}

function formatStatsNumber(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export default function PromptCard({ id, title, imageUrl, tool, creator, likes: initialLikes, saves: initialSaves, description, remixOf, remixCount, aspectRatio = '1:1', category = 'General', imageWidth, imageHeight }: PromptCardProps) {
  const router = useRouter();
  
  const supabase = createClient();
  const [isHovered, setIsHovered] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaves > 0 ? true : false); // Optimistic default, ideally passed from parent
  const [likes, setLikes] = useState(initialLikes);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isUnsaveOpen, setIsUnsaveOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 144; // w-36 = 144px
      const margin = 8;
      
      let left = rect.right + window.scrollX - dropdownWidth;
      // Ensure it doesn't overflow screen left/right
      if (left < window.scrollX + margin) {
        left = window.scrollX + margin;
      } else if (left + dropdownWidth > window.scrollX + window.innerWidth - margin) {
        left = window.scrollX + window.innerWidth - dropdownWidth - margin;
      }

      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: left,
      });
    }
  };

  useEffect(() => {
    if (menuOpen) {
      updateMenuPosition();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    
    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);
    
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [menuOpen]);

  useEffect(() => {
    let active = true;
    async function fetchStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (active) {
          setIsLoggedIn(!!user);
          if (user) {
            const isUserOwner = user.user_metadata?.username === creator?.username;
            setIsOwner(isUserOwner);
          }
        }
        if (!user || !active) return;

        const status = await checkInteractionStatus(id);
        if (active) {
          setIsLiked(status.isLiked);
          setIsSaved(status.isSaved);
        }
      } catch (err) {
        console.error('Error fetching interaction status in card:', err);
      }
    }
    fetchStatus();
    return () => {
      active = false;
    };
  }, [id, supabase, creator?.username]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const clickedMenuButton = menuRef.current && menuRef.current.contains(target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      if (!clickedMenuButton && !clickedDropdown) {
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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCardClick = () => {
    router.push(`/prompt/${id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoginRequiredOpen(true);
      return;
    }

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    if (!isOwner) {
      setLikes(prev => wasLiked ? prev - 1 : prev + 1);
    }

    const res = await toggleLike(id, wasLiked);
    if (!res.success) {
      setIsLiked(wasLiked);
      if (!isOwner) {
        setLikes(prev => wasLiked ? prev + 1 : prev - 1);
      }
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoginRequiredOpen(true);
      return;
    }

    if (isSaved) {
      setIsUnsaveOpen(true);
    } else {
      setIsSaveOpen(true);
    }
  };

  const handleUnsaveConfirm = async () => {
    setIsSaved(false);
    const res = await removePromptFromAllCollections(id);
    if (!res.success) {
      setIsSaved(true);
    } else {
      showToast('Removed from collections.');
    }
  };

  const handleToolClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/discover?tool=${tool}`);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        showToast('Copied link to clipboard!');
      } else {
        showToast('Copy failed. Please manually select the URL.');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showToast('Copy failed. Please copy the URL from browser bar.');
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    const url = `${window.location.origin}/prompt/${id}`;
    
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => showToast('Copied link to clipboard!'))
          .catch((err) => {
            console.error('Failed to copy link via writeText:', err);
            fallbackCopyText(url);
          });
      } else {
        fallbackCopyText(url);
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      fallbackCopyText(url);
    }
  };

  const handleHidePrompt = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);

    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }

    setIsHidden(true);
    showToast('Prompt hidden from your feed.');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const res = await hidePromptUser(id, true);
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

  const handleReportPrompt = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);

    if (!isLoggedIn) {
      setIsLoginRequiredOpen(true);
      return;
    }

    setIsReportOpen(true);
  };

  if (isHidden) return null;

  return (
    <>
      <SaveModal
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        promptId={id}
        onSaveSuccess={() => {
          setIsSaved(true);
          showToast('Saved successfully.');
        }}
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
        entityId={id}
        entityName={title}
      />
      <LoginRequiredModal
        isOpen={isLoginRequiredOpen}
        onClose={() => setIsLoginRequiredOpen(false)}
      />
      
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] bg-zinc-900 text-white px-6 py-3 rounded-full shadow-xl font-medium text-sm animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
          {toastMessage}
        </div>
      )}

      <div 
        onClick={handleCardClick}
        className={`block w-full mb-4 sm:mb-6 break-inside-avoid bg-white rounded-3xl relative group cursor-pointer border border-black/5 hover:border-[var(--color-neon-purple)]/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 animate-in fade-in duration-300 overflow-hidden ${menuOpen ? 'z-40' : 'z-0 hover:z-30'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
      >
        <div 
          className="relative w-full bg-zinc-100 rounded-t-3xl overflow-hidden z-0 transition-all duration-300"
          style={{ aspectRatio: getTrueAspectRatioStyle(aspectRatio, imageWidth, imageHeight) }}
        >
          {/* Remix Badges Overlay */}
          {remixOf && (
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-md ${
                likes > 10 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 border border-purple-400/20' 
                  : 'bg-black/60 border border-white/10'
              }`}>
                {likes > 10 ? '🔥 Popular Remix' : '⚡ Remix'}
              </span>
            </div>
          )}
          
          {!remixOf && remixCount && remixCount >= 3 ? (
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <span className="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-md bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-400/20 backdrop-blur-md">
                🌿 Original
              </span>
            </div>
          ) : null}

          {imageUrl ? (
            <ProgressiveImage 
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover rounded-t-3xl transition-transform duration-700 group-hover:scale-105 z-0 relative"
              type="card"
            />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-purple-600/[0.08] to-blue-600/[0.04] flex flex-col justify-between p-6 relative group-hover:scale-105 transition-transform duration-500 select-none border-b border-zinc-100/50 min-h-[240px]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/[0.03] via-transparent to-transparent pointer-events-none" />
              {/* Top row: Tool badge */}
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 rounded-full bg-zinc-900/5 text-[9px] font-black uppercase tracking-wider text-zinc-600 border border-zinc-900/5 backdrop-blur-xs">
                  {tool}
                </span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              
              {/* Middle: Title */}
              <div className="my-auto py-4">
                <span className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">{category}</span>
                <h4 className="text-sm font-black text-zinc-800 tracking-tight leading-snug line-clamp-3 uppercase">
                  {title}
                </h4>
              </div>

              {/* Bottom: Registry label */}
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                <span>Collaborative Prompt Registry</span>
              </div>
            </div>
          )}
          
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 transition-opacity duration-300 z-10 ${menuOpen ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100 opacity-100'}`}>
            {/* Top actions: Save and More options */}
            <div className={`absolute top-4 right-4 flex items-center space-x-2 transition-all duration-300 z-40 ${menuOpen ? 'translate-y-0 opacity-100' : 'md:-translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 translate-y-0 opacity-100'}`}>
              <button 
                onClick={handleSaveClick}
                className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 shadow-sm cursor-pointer ${isSaved ? 'bg-[var(--color-electric-blue)] text-white' : 'bg-white/95 text-zinc-700 hover:text-white hover:bg-[var(--color-neon-purple)] hover:scale-105'}`}
                aria-label={isSaved ? 'Unsave prompt' : 'Save prompt'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              </button>

              <div className="relative" ref={menuRef}>
                <button 
                  ref={buttonRef}
                  onClick={handleMenuToggle}
                  className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 shadow-sm cursor-pointer ${menuOpen ? 'bg-zinc-950 text-white' : 'bg-white/95 text-zinc-700 hover:text-white hover:bg-zinc-950 hover:scale-105'}`}
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>



            {/* Bottom-left overlay: Aspect ratio and Tool badges */}
            <div className={`absolute bottom-4 left-4 flex flex-wrap gap-1.5 pointer-events-none z-40 transition-all duration-300 ${menuOpen ? 'translate-y-0 opacity-100' : 'md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 translate-y-0 opacity-100'}`}>
              <span className="px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-bold text-white uppercase tracking-wide backdrop-blur-xs border border-white/10">
                {tool}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-bold text-white uppercase tracking-wide backdrop-blur-xs border border-white/10">
                {aspectRatio}
              </span>
            </div>
          </div>
        </div>
        
        {/* Bottom info - clean white footer */}
        <div className="p-3 sm:p-4 bg-white">
          {remixOf && (
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-[var(--color-neon-purple)] uppercase tracking-wider mb-1">
              <GitFork className="w-3 h-3 text-[var(--color-neon-purple)]" />
              Remix Variation
            </span>
          )}
          <h3 className={`text-zinc-900 font-extrabold leading-snug mb-3 transition-colors group-hover:text-[var(--color-neon-purple)] line-clamp-2 ${
            remixOf ? 'text-xs md:text-sm text-zinc-700 font-bold' : 'text-sm'
          }`}>{title}</h3>
          
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100/50">
            <Link 
              href={`/creator/${creator?.username || ''}`} 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-2 group/creator py-1 -my-1 min-w-0"
            >
              <Avatar 
                src={creator?.avatarUrl} 
                username={creator?.username || 'U'} 
                size="custom" 
                className="w-7 h-7 text-xs group-hover/creator:shadow-sm transition-shadow border border-zinc-200/20" 
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-zinc-900 font-bold group-hover/creator:text-[var(--color-neon-purple)] transition-colors leading-tight flex items-center gap-1 min-w-0">
                  <span className="truncate max-w-[80px] sm:max-w-[100px] shrink-0">
                    {creator?.displayName || creator?.username || 'Unknown Creator'}
                  </span>
                  {creator?.badges?.includes('verified') && (
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 shrink-0" />
                  )}
                </span>
                <span className="text-[9px] text-zinc-500 font-medium truncate max-w-[100px] sm:max-w-[120px] leading-tight">
                  @{creator?.username || 'unknown'}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 py-1 px-2 rounded-full hover:bg-zinc-50 transition-colors text-zinc-500 hover:text-red-500 group/like shrink-0 cursor-pointer"
              aria-label={isLiked ? 'Unlike prompt' : 'Like prompt'}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform duration-300 group-hover/like:scale-110 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
              <span className={`text-[11px] font-bold ${isLiked ? 'text-red-500' : 'text-zinc-500'}`}>
                {formatStatsNumber(likes)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {mounted && menuOpen && coords && createPortal(
        <div 
          ref={dropdownRef}
          style={{ 
            position: 'absolute', 
            top: `${coords.top}px`, 
            left: `${coords.left}px`,
          }}
          className="w-36 bg-white/95 border border-zinc-200/50 rounded-2xl shadow-xl backdrop-blur-md py-1.5 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-3.5 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-zinc-400" />
            Copy Link
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(false);
              if (!isLoggedIn) {
                setIsLoginRequiredOpen(true);
              } else {
                router.push(`/create?remixId=${id}`);
              }
            }}
            className="w-full px-4 py-3.5 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-t border-zinc-100/50 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[var(--color-neon-purple)]" />
            Remix Prompt
          </button>
          <button
            onClick={handleHidePrompt}
            className="w-full px-4 py-3.5 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-t border-zinc-100/50 cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
            Hide Prompt
          </button>
          <button
            onClick={handleReportPrompt}
            className="w-full px-4 py-3.5 text-left text-xs font-bold text-red-650 hover:bg-red-50/50 flex items-center gap-2 border-t border-zinc-100 mt-1 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            Flag Review
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
