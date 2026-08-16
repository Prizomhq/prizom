'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, AlertCircle, History, Clock, Trash2, ChevronRight, FileText, Zap, Layers } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { useImageCompressor } from './useImageCompressor';
import { createStudioSessionAction, getUserStudioHistoryAction, getStudioSessionAction, deleteStudioSessionAction } from '@/app/actions/studio';
import { PrizomAIStudioLogo, PrizomAIStudioMark } from '@/components/ui/PrizomAIStudioMark';
import { CreditTopUpModal } from '@/components/shared/CreditTopUpModal';

export function StudioUploader() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const { compressImage, isCompressing } = useImageCompressor();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{
    name: string;
    sizeFormatted: string;
    mimeType: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessingRef = useRef(false);

  const processAndUpload = useCallback(async (file: File) => {
    if (!file) return;

    if (isProcessingRef.current || isUploading) {
      console.warn('[STUDIO UPLOADER] Upload process locked against rapid duplicate clicks.');
      return;
    }

    if (state.credits <= 0) {
      setUploadError('You have run out of AI Studio credits. Please wait for your monthly allocation or upgrade to Pro.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid image format. Only JPG, PNG, and WebP are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be under 10MB.');
      return;
    }

    isProcessingRef.current = true;
    setUploadError(null);
    setIsUploading(true);

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setSelectedFileMeta({
      name: file.name,
      sizeFormatted: `${sizeInMB} MB`,
      mimeType: file.type
    });

    try {
      // 1. Client-side technical inspection & 4-layer aspect ratio analysis
      const compressed = await compressImage(file, 1024);
      const compressedFile = new File([compressed.blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
        type: 'image/webp'
      });

      // 2. Upload to Cloudinary via /api/upload
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folder', 'studio-drafts');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadResult.error || 'Failed to upload draft image.');
      }

      // 3. Create Studio Session record
      const requestId = crypto.randomUUID();
      const sessionRes = await createStudioSessionAction(
        uploadResult.url,
        uploadResult.publicId,
        requestId,
        {
          width: compressed.width,
          height: compressed.height,
          aspectRatio: compressed.aspectRatio
        }
      );

      if (!sessionRes.success || !sessionRes.session) {
        throw new Error(sessionRes.error || 'Failed to create AI Studio session.');
      }

      // 4. Dispatch SET_IMAGE to step into 'analyzing' WITHOUT pushing URL query param yet
      dispatch({
        type: 'SET_IMAGE',
        url: uploadResult.url,
        sessionId: sessionRes.session.id,
        credits: Math.max(0, state.credits - 1),
        aspectRatio: compressed.aspectRatio,
        aspectRatioDetails: compressed.aspectRatioDetails,
        width: compressed.width,
        height: compressed.height,
        mimeType: file.type,
        fileSize: file.size
      });

    } catch (err: any) {
      console.error('[STUDIO UPLOADER ERROR]', err);
      setUploadError(err.message || 'An unexpected error occurred during upload.');
      dispatch({ type: 'SET_ERROR', message: err.message || 'Upload failed.' });
    } finally {
      setIsUploading(false);
      isProcessingRef.current = false;
    }
  }, [compressImage, dispatch, isUploading, state.credits]);

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  const handleClaimDailyCredits = async () => {
    setIsClaiming(true);
    setClaimStatus(null);
    try {
      const { claimDailyCreditsAction } = await import('@/app/actions/studio');
      const res = await claimDailyCreditsAction();
      if (res.success && typeof res.balance === 'number') {
        dispatch({ type: 'UPDATE_CREDITS', credits: res.balance });
        setClaimStatus('✓ Claimed +5 Free Credits!');
      } else {
        setClaimStatus(res.error || 'Claim unavailable today');
      }
    } catch (err: any) {
      setClaimStatus(err.message || 'Claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    processAndUpload(file);
  }, [processAndUpload]);

  // Global Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.files || e.clipboardData.files.length === 0) {
        if (e.clipboardData?.items) {
          for (let i = 0; i < e.clipboardData.items.length; i++) {
            const item = e.clipboardData.items[i];
            if (item.type.indexOf('image') !== -1) {
              const pastedBlob = item.getAsFile();
              if (pastedBlob) {
                e.preventDefault();
                handleFileSelect(pastedBlob);
                return;
              }
            }
          }
        }
        return;
      }
      
      const file = e.clipboardData.files[0];
      if (file && file.type.startsWith('image/')) {
        e.preventDefault();
        handleFileSelect(file);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-10">
      {/* Official Prizom AI Studio Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-sm mb-4">
          <PrizomAIStudioLogo size="sm" showBadge={true} />
          <span className="text-indigo-600 font-mono text-[11px] font-bold border-l border-slate-200 pl-2.5">
            1 Credit / Generation
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3">
          Turn an image into its prompt.
        </h1>
        <p className="text-slate-600 font-medium text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Upload any AI-generated artwork and Prizom will analyze its visual elements to reconstruct a detailed, reusable prompt.
        </p>
      </div>

      {/* Actionable Validation Error Card */}
      {uploadError && (
        <div className="mb-6 p-4 sm:p-5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3.5 text-amber-900 text-xs sm:text-sm animate-in fade-in duration-200 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950">Unable to analyze image</h4>
            <p className="text-amber-800 leading-relaxed">{uploadError}</p>
            <p className="text-amber-700 font-medium text-[11px] pt-1">
              Tip: Ensure your file is a JPG, PNG, or WebP under 10MB and contains visual artistic content.
            </p>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/80 shadow-lg scale-[1.01]'
            : 'border-slate-200/80 bg-white/80 hover:bg-white hover:border-indigo-400/80 hover:shadow-md glass-card'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        <div className="relative z-10">
          {isCompressing || isUploading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-50 rounded-full animate-pulse" />
                <Loader2 className="relative w-10 h-10 text-indigo-600 animate-spin" />
              </div>
              <p className="text-slate-900 font-bold text-base sm:text-lg mb-1 tracking-tight">
                {isCompressing ? 'Inspecting image details...' : 'Uploading image for analysis...'}
              </p>
              {selectedFileMeta && (
                <div className="mt-2 text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full">
                  {selectedFileMeta.name} • {selectedFileMeta.sizeFormatted}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform duration-300">
                <PrizomAIStudioMark size={32} />
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 tracking-tight">
                Drag & drop an image here, or <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-4 font-extrabold">upload image</span>
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mb-6">
                Supported formats: JPG, PNG, WebP up to 10MB • <kbd className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">Ctrl+V</kbd> to paste
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <PrizomAIStudioMark size={16} />
                <span>Upload Image & Generate Prompt (1 Credit)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Credit Status Bar */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-600 bg-white/90 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <span className="flex items-center gap-2 text-slate-600 font-medium">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Automated visual composition & prompt deconstruction</span>
        </span>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full font-mono">
            Balance: {state.credits} Credits
          </span>

          <button
            type="button"
            onClick={() => setIsTopUpOpen(true)}
            className="px-3.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-300" /> Top Up
          </button>

          <button
            type="button"
            onClick={handleClaimDailyCredits}
            disabled={isClaiming}
            className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isClaiming ? 'Claiming...' : '🎁 Daily'}
          </button>
        </div>
      </div>

      {claimStatus && (
        <div className="mt-2 text-center text-xs font-bold text-emerald-600 animate-in fade-in">
          {claimStatus}
        </div>
      )}

      <CreditTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        currentBalance={state.credits}
        onTopUpSuccess={(newBal) => {
          dispatch({ type: 'UPDATE_CREDITS', credits: newBal });
        }}
      />

      {/* Restore Previous Work / Generation History */}
      <PastGenerationsSection />
    </div>
  );
}

function PastGenerationsSection() {
  const dispatch = useStudioDispatch();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserStudioHistoryAction(20);
      if (res.success && Array.isArray(res.history)) {
        setHistory(res.history);
      }
    } catch (err) {
      console.warn('[STUDIO HISTORY WARNING] Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleOpenSession = async (sessionId: string, url: string) => {
    setLoadingSessionId(sessionId);
    try {
      const res = await getStudioSessionAction(sessionId);
      if (res.success && res.session) {
        const latestVersion = res.versions && res.versions.length > 0
          ? res.versions[res.versions.length - 1]
          : null;

        const rawAg = latestVersion?.ag_router_response;
        let parsedAg: any = null;
        if (rawAg) {
          if (typeof rawAg === 'string') {
            try { parsedAg = JSON.parse(rawAg); } catch (_) {}
          } else if (typeof rawAg === 'object') {
            parsedAg = rawAg;
          }
        }

        const resolvedPromptText = (latestVersion?.prompt_text && latestVersion.prompt_text !== 'Visual prompt deconstruction')
          ? latestVersion.prompt_text
          : (parsedAg?.prompt?.main && parsedAg.prompt.main !== 'Visual prompt deconstruction')
            ? parsedAg.prompt.main
            : (parsedAg?.reverse_prompts?.flux_prompt)
              ? parsedAg.reverse_prompts.flux_prompt
              : (typeof parsedAg?.prompt === 'string' && parsedAg.prompt)
                ? parsedAg.prompt
                : '';

        if (!resolvedPromptText && res.session.status === 'failed') {
          dispatch({
            type: 'SET_ERROR',
            message: res.session.error_message || 'This generation failed.'
          });
          return;
        }

        if (parsedAg && resolvedPromptText) {
          const response = {
            ...parsedAg,
            prompt: typeof parsedAg.prompt === 'object' ? {
              ...parsedAg.prompt,
              main: resolvedPromptText
            } : {
              main: resolvedPromptText,
              negative: parsedAg.negative_prompt || 'blurry, low quality, noise, distortion, watermark',
              style: parsedAg.style || 'Photorealistic',
              lighting: parsedAg.lighting || 'Natural studio lighting',
              composition: parsedAg.composition || 'Centered framing',
              camera: parsedAg.camera || '50mm prime lens',
              colorPalette: parsedAg.colorPalette || ['#A855F7', '#06B6D4', '#0F172A'],
              mood: parsedAg.mood || 'Cinematic atmosphere'
            }
          };

          if (typeof window !== 'undefined') {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('session', sessionId);
            window.history.pushState({ sessionId }, '', newUrl.toString());
          }

          dispatch({
            type: 'HYDRATE_SESSION',
            sessionId: res.session.id,
            url: res.session.cloudinary_url || url,
            response,
            activeVersion: res.session.active_version || 1,
            aspectRatio: res.session.aspect_ratio || response?.metadata?.aspectRatio || '1:1'
          });
        }
      }
    } catch (err) {
      console.error('[STUDIO HISTORY] Error opening session:', err);
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const previousHistory = [...history];
    setHistory((prev) => prev.filter((item) => item.session.id !== sessionId));

    try {
      const res = await deleteStudioSessionAction(sessionId);
      if (!res.success) {
        setHistory(previousHistory);
      }
    } catch (err) {
      setHistory(previousHistory);
    }
  };

  if (loading) {
    return (
      <div className="mt-10 p-6 bg-white/80 border border-slate-200/80 rounded-3xl text-center shadow-sm">
        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" />
        <span className="text-xs text-slate-500 font-medium">Loading recent generations...</span>
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" /> Recent Generations ({history.length})
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          Saved in account
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {history.map(({ session, latestVersion }) => {
          let parsedAg: any = null;
          if (latestVersion?.ag_router_response) {
            if (typeof latestVersion.ag_router_response === 'string') {
              try { parsedAg = JSON.parse(latestVersion.ag_router_response); } catch (_) {}
            } else if (typeof latestVersion.ag_router_response === 'object') {
              parsedAg = latestVersion.ag_router_response;
            }
          }
          const rawSnippet = latestVersion?.prompt_text || parsedAg?.prompt?.main || '';
          const promptSnippet = (rawSnippet && rawSnippet !== 'Visual prompt deconstruction')
            ? rawSnippet
            : 'Universal Visual Spec';
          const title = parsedAg?.metadata?.title || (promptSnippet !== 'Universal Visual Spec' ? promptSnippet.slice(0, 32) + '...' : 'Reconstructed Prompt');
          const aspectRatio = session.aspect_ratio || parsedAg?.metadata?.aspectRatio || '1:1';
          const createdDate = new Date(session.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={session.id}
              onClick={() => handleOpenSession(session.id, session.cloudinary_url)}
              className="group relative bg-white/90 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex gap-3.5 items-center shadow-sm hover:shadow-md"
            >
              <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                {session.cloudinary_url ? (
                  <img
                    src={session.cloudinary_url}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-[9px] font-mono font-bold text-white">
                  {aspectRatio}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {title}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-all rounded"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-sans mb-1.5">
                  {promptSnippet}
                </p>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  <span>{createdDate}</span>
                  <span className="text-slate-300">•</span>
                  <span className="capitalize text-indigo-600 font-bold">{session.status}</span>
                </div>
              </div>

              {loadingSessionId === session.id ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

