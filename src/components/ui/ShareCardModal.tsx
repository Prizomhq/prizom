'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Download, Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[10000] bg-zinc-950/95 border border-zinc-800 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs tracking-wide backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity"
        onClick={() => !loading && !isDownloading && onClose()}
      />

      {/* Modal Card container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-card-title"
        className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] max-w-lg w-full shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden transform animate-in fade-in zoom-in-95 duration-250 flex flex-col max-h-[90vh]"
      >
        {/* Glow Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-neon-purple)] via-indigo-500 to-[var(--color-electric-blue)]"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center space-x-2.5 text-white">
            <div className="p-2 bg-purple-500/10 text-[var(--color-neon-purple)] rounded-xl border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 id="share-card-title" className="text-base font-black tracking-tight uppercase">Share Card Generator</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading || isDownloading}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/50 border border-zinc-700/30 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Close Share Card Generator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-6 text-zinc-400 w-full py-12">
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[var(--color-neon-purple)] animate-spin" />
                <ImageIcon className="w-5 h-5 text-indigo-400 absolute" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-bold text-zinc-200">Generating branded image...</p>
                <p className="text-xs text-zinc-500">Creating a premium social card at 1080x1350 px</p>
              </div>

              {/* Shimmer skeleton */}
              <div className="w-[200px] aspect-[4/5] bg-zinc-800/40 rounded-2xl animate-pulse border border-zinc-800/50 mt-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center space-y-4 text-center py-10 w-full">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h4 className="font-extrabold text-white text-base">Generation Failed</h4>
                <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  onClose();
                }}
                className="mt-4 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-all"
              >
                Go Back
              </button>
            </div>
          )}

          {!loading && !error && imageUrl && (
            <div className="w-full flex flex-col items-center space-y-6">
              {/* Image Preview frame */}
              <div className="relative group max-w-[280px] sm:max-w-[320px] w-full rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/80 aspect-[4/5]">
                {/* Preview Badge */}
                <span className="absolute top-3 left-3 bg-zinc-950/80 text-zinc-400 border border-zinc-800/50 rounded-md px-2.5 py-1 text-[9px] font-black uppercase tracking-wider z-20">
                  Preview (4:5)
                </span>
                
                {/* Image */}
                <img
                  src={imageUrl}
                  alt={promptTitle}
                  className="w-full h-full object-cover select-none"
                />
              </div>

              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center">
                Ready for Instagram, X, LinkedIn, and Threads
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        {!loading && !error && imageUrl && (
          <div className="px-6 py-5 border-t border-zinc-800/60 bg-zinc-950/20 shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPng}
              disabled={isDownloading}
              className="flex-1 h-12 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white text-zinc-200 rounded-full font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 shrink-0" />
              Download PNG
            </button>
            
            <button
              onClick={handleDownloadJpg}
              disabled={isDownloading}
              className="flex-1 h-12 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg text-white rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 shrink-0" />
              Download JPG
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
