'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Sparkles, CheckCircle2, AlertTriangle, ArrowLeft, Copy, Share2 } from 'lucide-react';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  promptTitle: string;
}

export default function ShareCardModal({ isOpen, onClose, promptId, promptTitle }: ShareCardModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Trigger Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch share card on open
  useEffect(() => {
    if (!isOpen || !promptId) return;

    let active = true;
    const fetchShareCard = async () => {
      setLoading(true);
      setError(null);
      setImageBlob(null);

      // Clean up previous image URL if any
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }

      try {
        const res = await fetch(`/api/prompts/${promptId}/share-card`, {
          cache: 'no-store'
        });

        if (!res.ok) {
          let errMsg = 'Failed to generate share card.';
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch {
            // ignore JSON parse error
          }
          throw new Error(errMsg);
        }

        const blob = await res.blob();
        if (active) {
          setImageBlob(blob);
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Something went wrong while generating your card.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchShareCard();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, promptId]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (!isOpen) return null;

  const fileNameBase = promptTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Download direct PNG
  const handleDownloadPng = () => {
    if (!imageUrl) return;
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `prizom-${fileNameBase}-share-card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Your share card is ready.');
    } catch (err) {
      console.error(err);
      showToast('Failed to download PNG.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Convert to high-quality JPG on client side using temporary canvas
  const handleDownloadJpg = () => {
    if (!imageBlob) return;
    setIsDownloading(true);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context not available');
        }

        // Fill dark charcoal background for JPEG to match Prizom style
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const jpgUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = jpgUrl;
              link.download = `prizom-${fileNameBase}-share-card.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(jpgUrl);
              showToast('Your share card is ready.');
            } else {
              throw new Error('Canvas toBlob returned null');
            }
          },
          'image/jpeg',
          0.96 // high premium quality
        );
      } catch (err) {
        console.error(err);
        showToast('Failed to convert and download JPG.');
      } finally {
        setIsDownloading(false);
      }
    };
    img.onerror = () => {
      showToast('Failed to parse share card image.');
      setIsDownloading(false);
    };
    img.src = imageUrl || '';
  };

  // Copy PNG image to clipboard
  const handleCopyImage = async () => {
    if (!imageBlob) return;
    setIsDownloading(true);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [imageBlob.type]: imageBlob
        })
      ]);
      showToast('Image copied to clipboard.');
    } catch (err) {
      console.error('Failed to copy image:', err);
      showToast('Copy image not supported or failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Share card or fallback to copy link
  const handleShareCard = async () => {
    if (!imageBlob) return;
    setIsDownloading(true);
    try {
      const file = new File([imageBlob], `prizom-${fileNameBase}-share-card.png`, {
        type: 'image/png'
      });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Prizom Share Card: ${promptTitle}`,
          text: `Check out my prompt "${promptTitle}" on Prizom!`
        });
        showToast('Card shared successfully!');
      } else {
        // Fallback: Copy link
        const shareUrl = `${window.location.origin}/prompt/${promptId}`;
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Sharing failed:', err);
        try {
          const shareUrl = `${window.location.origin}/prompt/${promptId}`;
          await navigator.clipboard.writeText(shareUrl);
          showToast('Link copied to clipboard.');
        } catch (clipErr) {
          showToast('Failed to share or copy link.');
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-title"
      className="fixed inset-0 z-[9999] bg-[#0a0a0c] text-zinc-100 flex flex-col overflow-hidden animate-in fade-in duration-300"
    >
      {/* Background Animated Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[10000] bg-zinc-900/90 border border-zinc-800 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs tracking-wide backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex flex-col h-full w-full relative z-10">
        
        {/* Full-screen Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-6 text-zinc-400">
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-purple-500/10 border-t-purple-500 animate-spin absolute" />
              {/* Custom Branded geometric P logo */}
              <svg
                width="36"
                height="36"
                viewBox="25 15 63 67"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-pulse relative z-10"
              >
                <path d="M 46,16 L 26,27.5 L 46,39 Z" fill="#3b4fe4" />
                <path d="M 50,17.5 L 50,39.5 L 67,28.5 Z" fill="#802cf6" />
                <path d="M 26,30 L 44,40.5 L 44,49.5 L 35,55 L 44,60.5 L 44,71.5 L 26,81 Z" fill="#2c3ce6" />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M 50,27.5 C 65,27.5 76,34 76,44.5 C 76,55 65,61.5 50,61.5 L 50,71.5 C 71,71.5 87,60 87,44.5 C 87,29 71,17.5 50,17.5 Z"
                  fill="url(#loadingLogoGrad)"
                />
                <line x1="35" y1="55" x2="51" y2="43" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="51" cy="43" r="4" fill="#a855f7" />
                <line x1="35" y1="55" x2="62" y2="55" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="62" cy="55" r="4" fill="#a855f7" />
                <line x1="35" y1="55" x2="51" y2="67" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="51" cy="67" r="4" fill="#a855f7" />
                <defs>
                  <linearGradient id="loadingLogoGrad" x1="50" y1="17.5" x2="50" y2="71.5" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#802cf6" />
                    <stop offset="100%" stopColor="#2c3ce6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <div className="text-center space-y-3 max-w-md">
              <h2 id="share-card-title" className="text-2xl font-black text-white tracking-tight uppercase">
                Creator Share Card Studio
              </h2>
              <p className="text-sm text-zinc-400 font-medium">
                Rendering your premium branded social card at 1080x1350 px...
              </p>
            </div>

            {/* Shimmer skeleton */}
            <div className="h-[50vh] sm:h-[60vh] lg:h-[70vh] aspect-[4/5] bg-zinc-900/60 rounded-[2rem] border border-zinc-800/80 mt-6 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
              <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-zinc-800/30" />
              <div className="absolute top-4 right-4 w-20 h-5 rounded-full bg-zinc-800/30" />
              <div className="absolute bottom-16 left-4 right-4 h-32 rounded-xl bg-zinc-800/30" />
              <div className="absolute bottom-4 left-4 w-28 h-4 rounded bg-zinc-800/20" />
            </div>
          </div>
        )}

        {/* Full-screen Error State */}
        {error && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center p-6">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
              <AlertTriangle className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2 max-w-md">
              <h4 className="font-extrabold text-white text-xl uppercase tracking-wider">Workspace Error</h4>
              <p className="text-zinc-400 text-sm font-semibold leading-relaxed">
                {error}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-6 px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 text-zinc-200 text-xs font-black uppercase tracking-wider rounded-full transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Back to Prompt
            </button>
          </div>
        )}

        {/* Studio Viewport (Loaded Success State) */}
        {!loading && !error && imageUrl && (
          <div className="flex-1 flex flex-col lg:flex-row h-full">
            
            {/* Left/Top Pane: Card Preview Viewport */}
            <div className="flex-1 bg-zinc-950/40 border-b lg:border-b-0 lg:border-r border-zinc-800/40 pt-18 pb-6 px-6 sm:p-12 flex items-center justify-center relative overflow-y-auto min-h-0">
              
              {/* Back navigation button inside preview area */}
              <button
                onClick={onClose}
                disabled={isDownloading}
                className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-350 hover:text-white transition-all text-xs font-bold border border-zinc-800/60 shadow-md disabled:opacity-40 disabled:pointer-events-none"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Prompt
              </button>

              <div className="relative h-[60vh] sm:h-[70vh] lg:h-[76vh] xl:h-[80vh] max-h-[calc(100vh-120px)] w-auto max-w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 transition-all duration-300 hover:scale-[1.02]">
                <span className="absolute top-4 left-4 bg-zinc-950/80 text-zinc-400 border border-zinc-800/50 rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-wider z-20">
                  Preview Card (4:5)
                </span>
                <img
                  src={imageUrl}
                  alt={promptTitle}
                  className="w-full h-full object-contain select-none"
                />
              </div>
            </div>

            {/* Right/Bottom Pane: Control Dashboard Panel */}
            <div className="w-full lg:w-[480px] bg-zinc-900/30 backdrop-blur-xl p-8 sm:p-12 flex flex-col justify-between overflow-y-auto shrink-0 border-t lg:border-t-0 border-zinc-800/40">
              
              {/* Top Section: Studio Branding & Prompt Summary */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full w-fit flex items-center gap-1.5 animate-pulse">
                    <svg
                      width="12"
                      height="12"
                      viewBox="25 15 63 67"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 46,16 L 26,27.5 L 46,39 Z" fill="#3b4fe4" />
                      <path d="M 50,17.5 L 50,39.5 L 67,28.5 Z" fill="#802cf6" />
                      <path d="M 26,30 L 44,40.5 L 44,49.5 L 35,55 L 44,60.5 L 44,71.5 L 26,81 Z" fill="#2c3ce6" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M 50,27.5 C 65,27.5 76,34 76,44.5 C 76,55 65,61.5 50,61.5 L 50,71.5 C 71,71.5 87,60 87,44.5 C 87,29 71,17.5 50,17.5 Z"
                        fill="url(#badgeLogoGrad)"
                      />
                      <line x1="35" y1="55" x2="51" y2="43" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="51" cy="43" r="4" fill="#a855f7" />
                      <line x1="35" y1="55" x2="62" y2="55" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="62" cy="55" r="4" fill="#a855f7" />
                      <line x1="35" y1="55" x2="51" y2="67" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="51" cy="67" r="4" fill="#a855f7" />
                      <defs>
                        <linearGradient id="badgeLogoGrad" x1="50" y1="17.5" x2="50" y2="71.5" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#802cf6" />
                          <stop offset="100%" stopColor="#2c3ce6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    Workspace Studio
                  </span>
                  <h2 id="share-card-title" className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                    Creator Card Ready
                  </h2>
                  <p className="text-xs text-zinc-450 font-bold uppercase tracking-wider">
                    Generate & Download Branded Assets
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-zinc-950/50 border border-zinc-800/60 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Source Prompt</span>
                    <span className="text-xs font-bold text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-800">
                      Active
                    </span>
                  </div>
                  <h4 className="font-extrabold text-white text-base leading-snug line-clamp-2">
                    &quot;{promptTitle}&quot;
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    This premium share card naturally promotes your prompt template while showcasing your creator branding across visual feeds.
                  </p>
                </div>

                {/* Social Tips */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-wider block">Recommended Platforms</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                    <div className="px-3.5 py-2.5 bg-zinc-950/30 border border-zinc-800/40 rounded-xl flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Instagram
                    </div>
                    <div className="px-3.5 py-2.5 bg-zinc-950/30 border border-zinc-800/40 rounded-xl flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> LinkedIn
                    </div>
                    <div className="px-3.5 py-2.5 bg-zinc-950/30 border border-zinc-800/40 rounded-xl flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" /> X / Twitter
                    </div>
                    <div className="px-3.5 py-2.5 bg-zinc-950/30 border border-zinc-800/40 rounded-xl flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Threads
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Action Download & Share Buttons */}
              <div className="space-y-4 mt-8 lg:mt-12">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownloadPng}
                    disabled={isDownloading}
                    className="flex-1 h-12 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 hover:text-white rounded-full font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    PNG
                  </button>
                  
                  <button
                    onClick={handleDownloadJpg}
                    disabled={isDownloading}
                    className="flex-1 h-12 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 hover:text-white rounded-full font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    JPG
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCopyImage}
                    disabled={isDownloading}
                    className="flex-1 h-12 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 hover:text-white rounded-full font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <Copy className="w-4 h-4 shrink-0" />
                    Copy Image
                  </button>
                  
                  <button
                    onClick={handleShareCard}
                    disabled={isDownloading}
                    className="flex-1 h-12 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg text-white rounded-full font-extrabold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <Share2 className="w-4 h-4 shrink-0" />
                    Share Card
                  </button>
                </div>

                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center">
                  Assets generated locally on-demand
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
