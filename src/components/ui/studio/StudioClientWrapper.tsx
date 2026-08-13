'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudioProvider, useStudioState, useStudioDispatch } from './context';
import { StudioUploader } from './StudioUploader';
import { StudioLoading } from './StudioLoading';
import { StudioEditor } from './StudioEditor';
import { getStudioSessionAction } from '@/app/actions/studio';
import { Loader2 } from 'lucide-react';

function StudioContent() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('session');
  const [hydrating, setHydrating] = useState<boolean>(Boolean(sessionIdParam));

  useEffect(() => {
    let isMounted = true;

    const checkAndHydrateSession = async (targetSessionId: string | null) => {
      if (!targetSessionId) {
        setHydrating(false);
        return;
      }

      // If state is already hydrated for this session, no need to re-fetch
      if (state.sessionId === targetSessionId && state.aiResponse) {
        setHydrating(false);
        return;
      }

      try {
        setHydrating(true);
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

          const resolvedPromptText = (latestVersion?.prompt_text && latestVersion.prompt_text !== 'Visual prompt deconstruction' && !latestVersion.prompt_text.startsWith('A detailed high-fidelity visual artwork capturing'))
            ? latestVersion.prompt_text
            : (parsedAg?.prompt?.main && parsedAg.prompt.main !== 'Visual prompt deconstruction' && !parsedAg.prompt.main.startsWith('A detailed high-fidelity visual artwork capturing'))
              ? parsedAg.prompt.main
              : (parsedAg?.reverse_prompts?.flux_prompt)
                ? parsedAg.reverse_prompts.flux_prompt
                : (typeof parsedAg?.prompt === 'string' && parsedAg.prompt)
                  ? parsedAg.prompt
                  : 'High-precision AI image prompt capturing subject, optics, and lighting.';

          const hasValidAgPrompt = Boolean(parsedAg && (
            typeof parsedAg.prompt === 'string' ||
            typeof parsedAg.prompt?.main === 'string' ||
            typeof parsedAg.reverse_prompts?.flux_prompt === 'string'
          ));

          const response = hasValidAgPrompt ? {
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

          dispatch({
            type: 'HYDRATE_SESSION',
            sessionId: res.session.id,
            url: res.session.cloudinary_url,
            response,
            activeVersion: res.session.active_version || 1,
            aspectRatio: res.session.aspect_ratio || response?.metadata?.aspectRatio || '1:1'
          });
        }
      } catch (err) {
        console.warn('[STUDIO NAVIGATION] Failed to hydrate session from URL:', err);
      } finally {
        if (isMounted) setHydrating(false);
      }
    };

    checkAndHydrateSession(sessionIdParam);

    const handlePopState = () => {
      const currentUrl = new URL(window.location.href);
      const sessId = currentUrl.searchParams.get('session');
      if (sessId) {
        checkAndHydrateSession(sessId);
      } else {
        dispatch({ type: 'RESET_FLOW' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [sessionIdParam, state.sessionId, state.aiResponse, dispatch]);

  if (hydrating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 blur-xl opacity-30 rounded-full animate-pulse" />
          <Loader2 className="relative w-10 h-10 text-purple-400 animate-spin" />
        </div>
        <p className="text-sm font-bold text-white tracking-tight">Restoring Generation State...</p>
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
      <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-600 selection:text-white pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <StudioContent />
        </main>
      </div>
    </StudioProvider>
  );
}
