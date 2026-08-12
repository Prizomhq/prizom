'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, AlertCircle, Sparkles, History, Clock, Trash2, ChevronRight, FileText } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { useImageCompressor } from './useImageCompressor';
import { createStudioSessionAction, getUserStudioHistoryAction, getStudioSessionAction, deleteStudioSessionAction } from '@/app/actions/studio';
import PrizomLogo, { PrizomWordmark } from '@/components/ui/PrizomLogo';

export function StudioUploader() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const { compressImage, isCompressing } = useImageCompressor();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessingRef = useRef(false);

  const processAndUpload = useCallback(async (file: File) => {
    if (!file) return;

    if (isProcessingRef.current || isUploading) {
      console.warn('[STUDIO UPLOADER] Upload process locked against rapid duplicate clicks.');
      return;
    }

    // Check overdraft balance
    if (state.credits <= 0) {
      setUploadError('You have run out of AI Studio credits. Please wait for your monthly allocation or upgrade to Pro.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid image format. Only JPG, PNG, and WebP are allowed.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be under 5MB.');
      return;
    }

    isProcessingRef.current = true;
    setUploadError(null);
    setIsUploading(true);

    try {
      // 1. Compress image client-side via canvas & extract exact aspect ratio and dimensions
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

      // 3. Create Studio Session record in database with explicit metadata
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

      // Update URL with session ID for browser history push
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('session', sessionRes.session.id);
        window.history.pushState({ sessionId: sessionRes.session.id }, '', url.toString());
      }

      // 4. Update Reducer State (Deduct 1 credit)
      dispatch({
        type: 'SET_IMAGE',
        url: uploadResult.url,
        sessionId: sessionRes.session.id,
        credits: Math.max(0, state.credits - 1),
        aspectRatio: compressed.aspectRatio,
        width: compressed.width,
        height: compressed.height
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
        dispatch({ type: 'EDIT_FIELD', field: 'promptText', value: state.userEdits.promptText }); // trigger re-render
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

  // Global Ctrl+V Clipboard Image Paste Listener
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
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* V1 Hero Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
          <PrizomWordmark height={14} className="text-white" />
          <span className="text-purple-400 font-mono text-[11px] border-l border-zinc-700 pl-2">AI Studio • 1 Credit / Gen</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
          Image to Prompt
        </h1>
        <p className="text-zinc-400 font-medium text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Upload any AI image to get a production-ready prompt instantly.
        </p>
      </div>

      {uploadError && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-semibold animate-in fade-in duration-200 shadow-inner">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-[2.5rem] p-10 sm:p-14 text-center cursor-pointer transition-all duration-500 overflow-hidden ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_50px_rgba(168,85,247,0.25)] scale-[1.02]'
            : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-xl'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        {/* Ambient Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          {isCompressing || isUploading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-30 rounded-full animate-pulse" />
                <Loader2 className="relative w-12 h-12 text-purple-400 animate-spin" />
              </div>
              <p className="text-white font-bold text-lg mb-1 tracking-tight">
                {isCompressing ? 'Optimizing Image...' : 'Analyzing Visual Data...'}
              </p>
              <p className="text-zinc-400 text-xs font-medium">Generating your prompt instantly</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <UploadCloud className="relative w-9 h-9 text-purple-400" />
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                Drag & Drop image here, or <span className="text-purple-400 underline decoration-purple-500/40 underline-offset-4">browse file</span>
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm font-medium mb-6">
                Supports JPG, PNG, and WebP up to 5MB • <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-purple-300 font-mono text-[11px] border border-zinc-700">Ctrl+V</kbd> paste enabled
              </p>

              {/* Primary CTA Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-black text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Generate Prompt ✨ (1 Credit)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Credit Status & Daily Claim Indicator */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-zinc-400 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <ImageIcon className="w-3.5 h-3.5 text-purple-400/80" /> Auto-compressed WebP (1 Credit/Generation)
        </span>

        <div className="flex items-center gap-3">
          <span className="font-bold text-purple-300 bg-purple-950/80 border border-purple-800/40 px-3 py-1 rounded-full font-mono">
            Balance: {state.credits} Credits
          </span>

          <button
            type="button"
            onClick={handleClaimDailyCredits}
            disabled={isClaiming}
            className="px-3.5 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isClaiming ? 'Claiming...' : '🎁 Claim +5 Daily'}
          </button>
        </div>
      </div>

      {claimStatus && (
        <div className="mt-2 text-center text-xs font-bold text-emerald-400 animate-in fade-in">
          {claimStatus}
        </div>
      )}

      {/* Past Generations (Generation History) */}
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
            : 'A detailed high-fidelity visual artwork capturing subject composition, soft studio lighting vectors, and rich atmospheric depth.';

        const response = (parsedAg && parsedAg.prompt?.main) ? {
          ...parsedAg,
          prompt: {
            ...parsedAg.prompt,
            main: resolvedPromptText
          }
        } : {
          requestId: res.session.request_id || crypto.randomUUID(),
          prompt: {
            main: resolvedPromptText,
            negative: latestVersion?.negative_prompt || parsedAg?.prompt?.negative || 'blurry, low quality, noise, distortion, watermark',
            style: parsedAg?.prompt?.style || 'Photorealistic',
            lighting: parsedAg?.prompt?.lighting || 'Natural studio lighting',
            composition: parsedAg?.prompt?.composition || 'Centered framing',
            camera: parsedAg?.prompt?.camera || '50mm prime lens',
            colorPalette: parsedAg?.prompt?.colorPalette || ['#A855F7', '#06B6D4', '#0F172A'],
            mood: parsedAg?.prompt?.mood || 'Cinematic atmosphere'
          },
          metadata: {
            title: parsedAg?.metadata?.title || 'Universal Visual Specification',
            description: parsedAg?.metadata?.description || 'Reverse engineering analysis',
            tags: parsedAg?.metadata?.tags || ['ai-studio', 'saved-generation'],
            category: parsedAg?.metadata?.category || 'Photography',
            aspectRatio: res.session.aspect_ratio || parsedAg?.metadata?.aspectRatio || '1:1',
            promptType: 'image'
          },
          intelligence: {
            recommendedModel: 'flux-1-dev',
            recommendedPlatform: 'flux',
            supportedModels: ['flux-1-dev', 'midjourney-v6', 'sdxl-1.0'],
            launchUrl: 'https://prizom.in/studio'
          },
          quality: { confidenceScore: 0.95, qualityScore: 0.95, promptClarity: 0.98, estimatedOutputQuality: 'high' },
          safety: { flagged: false, flags: [], safetyScore: 0.99 },
          generation: { modelUsed: 'prizom-engine', provider: 'prizom-studio', latencyMs: 400, tokensUsed: 420, version: '3.0', timestamp: res.session.created_at }
        };

        // Push URL for browser history back navigation
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
    } catch (err) {
      console.error('[STUDIO HISTORY] Error opening session:', err);
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const res = await deleteStudioSessionAction(sessionId);
      if (res.success) {
        setHistory((prev) => prev.filter((item) => item.session.id !== sessionId));
      }
    } catch (err) {
      console.error('[STUDIO HISTORY] Error deleting session:', err);
    }
  };

  if (loading) {
    return (
      <div className="mt-10 p-6 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl text-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
        <span className="text-xs text-zinc-400 font-medium">Loading generation history...</span>
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" /> Past Generations ({history.length})
        </h3>
        <span className="text-[11px] text-zinc-500 font-mono">
          Saved in account history
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
            : 'Visual Scene Analysis';
          const title = parsedAg?.metadata?.title || (promptSnippet !== 'Visual Scene Analysis' ? promptSnippet.slice(0, 32) + '...' : 'Universal Visual Spec');
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
              className="group relative bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex gap-3.5 items-center shadow-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                {session.cloudinary_url ? (
                  <img
                    src={session.cloudinary_url}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-purple-300">
                  {aspectRatio}
                </span>
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className="text-xs font-extrabold text-white truncate group-hover:text-purple-300 transition-colors">
                    {title}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all rounded"
                    title="Delete generation history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-sans mb-1.5">
                  {promptSnippet}
                </p>

                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <Clock className="w-3 h-3 text-purple-400/80" />
                  <span>{createdDate}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="capitalize text-purple-400 font-bold">{session.status}</span>
                </div>
              </div>

              {loadingSessionId === session.id ? (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

