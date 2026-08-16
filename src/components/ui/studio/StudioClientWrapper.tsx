'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudioProvider, useStudioState, useStudioDispatch } from './context';
import { StudioUploader } from './StudioUploader';
import { StudioLoading } from './StudioLoading';
import { StudioEditor } from './StudioEditor';
import { getStudioSessionAction } from '@/app/actions/studio';
import { Loader2 } from 'lucide-react';
import { PrizomAIStudioMark } from '@/components/ui/PrizomAIStudioMark';

function StudioContent() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('session');
  
  // Hydrate only on initial page mount when session is explicitly present in URL and step is upload
  const [hydrating, setHydrating] = useState<boolean>(Boolean(sessionIdParam && state.step === 'upload' && !state.sessionId));

  useEffect(() => {
    let isMounted = true;

    const checkAndHydrateSession = async (targetSessionId: string | null) => {
      // Do NOT trigger restoration loader during active image upload flow
      if (!targetSessionId || state.step === 'analyzing' || (state.sessionId === targetSessionId && state.aiResponse)) {
        if (isMounted) setHydrating(false);
        return;
      }

      try {
        if (isMounted) setHydrating(true);
        const res = await getStudioSessionAction(targetSessionId);
        if (res.success && res.session && isMounted) {
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

          const hasValidAgPrompt = Boolean(resolvedPromptText && parsedAg);

          if (!hasValidAgPrompt && res.session.status === 'failed') {
            dispatch({
              type: 'SET_ERROR',
              message: res.session.error_message || 'This generation previously failed.'
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

            dispatch({
              type: 'HYDRATE_SESSION',
              sessionId: res.session.id,
              url: res.session.cloudinary_url,
              response,
              activeVersion: res.session.active_version || 1,
              aspectRatio: res.session.aspect_ratio || response?.metadata?.aspectRatio || '1:1'
            });
          }
        }
      } catch (err) {
        console.warn('[STUDIO NAVIGATION] Failed to hydrate session:', err);
      } finally {
        if (isMounted) setHydrating(false);
      }
    };

    if (state.step === 'upload' && !state.sessionId && sessionIdParam) {
      checkAndHydrateSession(sessionIdParam);
    } else {
      setHydrating(false);
    }

    const handlePopState = () => {
      const currentUrl = new URL(window.location.href);
      const sessId = currentUrl.searchParams.get('session');
      if (sessId && state.step === 'upload') {
        checkAndHydrateSession(sessId);
      } else if (!sessId && state.step !== 'upload') {
        dispatch({ type: 'RESET_FLOW' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [sessionIdParam, state.sessionId, state.aiResponse, state.step, dispatch]);

  if (hydrating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <PrizomAIStudioMark size={40} className="relative z-10 animate-spin text-indigo-600" />
        </div>
        <p className="text-sm font-semibold text-slate-700 tracking-tight">Restoring Prizom AI Studio Session...</p>
      </div>
    );
  }

  if (state.step === 'upload') {
    return <StudioUploader />;
  }

  if (state.step === 'analyzing') {
    return <StudioLoading />;
  }

  return <StudioEditor />;
}

export function StudioClientWrapper({ initialCredits }: { initialCredits: number }) {
  return (
    <StudioProvider initialCredits={initialCredits}>
      <div className="min-h-screen bg-[var(--background)] text-slate-900 selection:bg-indigo-600 selection:text-white pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <StudioContent />
        </main>
      </div>
    </StudioProvider>
  );
}

