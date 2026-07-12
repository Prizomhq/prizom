import { DBPrompt } from '@/types';

export interface LauncherPlatformConfig {
  id: string;
  displayName: string;
  defaultLaunchUrl: string;
  brandColor: string; // Tailwind class or Hex value for hover states
  iconSvg: string; // SVG path or markup
}

// Map of supported AI tools/platforms with launcher configurations
export const LAUNCHER_PLATFORMS: Record<string, LauncherPlatformConfig> = {
  chatgpt: {
    id: 'chatgpt',
    displayName: 'ChatGPT',
    defaultLaunchUrl: 'https://chatgpt.com',
    brandColor: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500/20',
    iconSvg: `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.3,10.6a5.7,5.7,0,0,0-1-3.6,5.8,5.8,0,0,0-4-2.5,5.6,5.6,0,0,0-5.3,1.3A5.7,5.7,0,0,0,7.3,4.7a5.8,5.8,0,0,0-4.3,3,5.6,5.6,0,0,0,.3,5.5,5.7,5.7,0,0,0,1,3.6,5.8,5.8,0,0,0,4,2.5,5.6,5.6,0,0,0,5.3-1.3,5.7,5.7,0,0,0,3.7,1.1,5.8,5.8,0,0,0,4.3-3A5.6,5.6,0,0,0,21.3,10.6ZM12,18.4a3.8,3.8,0,0,1-2.1-.6l.3-.2,4.8-2.8a1,1,0,0,0,.5-.8V7.5l1.6.9a.1.1,0,0,1,.1.1v6A3.8,3.8,0,0,1,12,18.4ZM4.7,14.6a3.8,3.8,0,0,1,0-2.2l.2.1,4.8,2.8a1,1,0,0,0,1,0L16.4,12v1.9a.1.1,0,0,1,0,.1L11.2,17A3.8,3.8,0,0,1,4.7,14.6ZM5.4,7.4A3.8,3.8,0,0,1,7.5,6.8L7.2,7,2.4,9.8A1,1,0,0,0,1.9,10.6V6.1l.1-.1A3.8,3.8,0,0,1,5.4,7.4ZM12,5.6a3.8,3.8,0,0,1,2.1.6l-.3.2L9,9.2A1,1,0,0,0,8.5,10V16.5l-1.6-.9a.1.1,0,0,1-.1-.1v-6A3.8,3.8,0,0,1,12,5.6ZM19.3,9.4a3.8,3.8,0,0,1,0,2.2l-.2-.1L14.3,8.7A1,1,0,0,0,13.3,8.7V12l-5.7-3.3a.1.1,0,0,1,0-.1l5.2-3A3.8,3.8,0,0,1,19.3,9.4ZM18.6,16.6A3.8,3.8,0,0,1,16.5,17.2l.3-.2,4.8-2.8a1,1,0,0,0,.5-.8v4.5l-.1.1A3.8,3.8,0,0,1,18.6,16.6ZM12,13.4,9.2,11.8V8.6L12,10.2Zm0,0" />
    </svg>`
  },
  gemini: {
    id: 'gemini',
    displayName: 'Gemini',
    defaultLaunchUrl: 'https://gemini.google.com',
    brandColor: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500/20',
    iconSvg: `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M12,2A10,10,0,0,0,4.6,18.5L12,12l7.4,6.5A10,10,0,0,0,12,2ZM12,6.5a2,2,0,1,1-2,2A2,2,0,0,1,12,6.5Zm0,7a3.5,3.5,0,1,1-3.5,3.5A3.5,3.5,0,0,1,12,13.5Z" />
    </svg>`
  },
  claude: {
    id: 'claude',
    displayName: 'Claude',
    defaultLaunchUrl: 'https://claude.ai/new',
    brandColor: 'bg-orange-700 hover:bg-orange-800 text-white focus:ring-orange-500/20',
    iconSvg: `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>`
  },
  grok: {
    id: 'grok',
    displayName: 'Grok',
    defaultLaunchUrl: 'https://grok.com',
    brandColor: 'bg-zinc-900 hover:bg-zinc-950 text-white focus:ring-zinc-800/20',
    iconSvg: `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>`
  },
  perplexity: {
    id: 'perplexity',
    displayName: 'Perplexity',
    defaultLaunchUrl: 'https://perplexity.ai',
    brandColor: 'bg-teal-700 hover:bg-teal-800 text-white focus:ring-teal-500/20',
    iconSvg: `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm1 14.93V18h-2v-1.07A6.002 6.002 0 0 1 6 11v-1h2v1a4 4 0 0 0 8 0v-1h2v1a6.002 6.002 0 0 1-5 5.93z" />
    </svg>`
  },
  flux: {
    id: 'flux',
    displayName: 'Flux',
    defaultLaunchUrl: 'https://blackforestlabs.ai',
    brandColor: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500/20',
    iconSvg: `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm1,17.93V15h-2v4.93A8.005,8.005,0,0,1,4,12H9v-2H4A8.005,8.005,0,0,1,11,4.07V9h2V4.07A8.005,8.005,0,0,1,20,12H15v2h5A8.005,8.005,0,0,1,13,19.93Z" />
    </svg>`
  },
  midjourney: {
    id: 'midjourney',
    displayName: 'Midjourney',
    defaultLaunchUrl: 'https://midjourney.com',
    brandColor: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500/20',
    iconSvg: `<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10c5.52,0,10-4.48,10-10S17.52,2,12,2zm1,15.92c-3.14-.42-5.5-2.9-5.5-5.92s2.36-5.5,5.5-5.92v2.04c-2.02.4-3.5,2.05-3.5,3.88s1.48,3.48,3.5,3.88v2.04z" />
    </svg>`
  }
};

// Fallback dynamic configurations for newer/generic platforms in Prizom seeding
export const GENERIC_PLATFORMS: Record<string, Omit<LauncherPlatformConfig, 'id'>> = {
  veo: {
    displayName: 'Veo',
    defaultLaunchUrl: 'https://deepmind.google/technologies/veo',
    brandColor: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/20',
    iconSvg: '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2Zm1,14.5h-2v-5h2Zm0-7h-2v-2h2Z"/></svg>'
  },
  runway: {
    displayName: 'Runway',
    defaultLaunchUrl: 'https://runwayml.com',
    brandColor: 'bg-zinc-800 hover:bg-zinc-900 text-white focus:ring-zinc-700/20',
    iconSvg: '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2Zm1,14.5h-2v-5h2Zm0-7h-2v-2h2Z"/></svg>'
  },
  'leonardo-ai': {
    displayName: 'Leonardo AI',
    defaultLaunchUrl: 'https://leonardo.ai',
    brandColor: 'bg-purple-700 hover:bg-purple-800 text-white focus:ring-purple-500/20',
    iconSvg: '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2Zm1,14.5h-2v-5h2Zm0-7h-2v-2h2Z"/></svg>'
  },
  ideogram: {
    displayName: 'Ideogram',
    defaultLaunchUrl: 'https://ideogram.ai',
    brandColor: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/20',
    iconSvg: '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2Zm1,14.5h-2v-5h2Zm0-7h-2v-2h2Z"/></svg>'
  },
  recraft: {
    displayName: 'Recraft',
    defaultLaunchUrl: 'https://recraft.ai',
    brandColor: 'bg-zinc-900 hover:bg-zinc-950 text-white focus:ring-zinc-800/20',
    iconSvg: '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2Zm1,14.5h-2v-5h2Zm0-7h-2v-2h2Z"/></svg>'
  }
};

/**
 * Normalizes a platform string to match key entries in config
 */
export function normalizePlatformKey(platform: string): string {
  if (!platform) return '';
  const clean = platform.trim().toLowerCase();
  if (clean.includes('chatgpt') || clean.includes('openai')) return 'chatgpt';
  if (clean.includes('gemini') || clean.includes('google')) return 'gemini';
  if (clean.includes('claude') || clean.includes('anthropic')) return 'claude';
  if (clean.includes('grok') || clean.includes('x.ai')) return 'grok';
  if (clean.includes('perplexity')) return 'perplexity';
  if (clean.includes('flux')) return 'flux';
  if (clean.includes('midjourney')) return 'midjourney';
  if (clean.includes('veo')) return 'veo';
  if (clean.includes('runway')) return 'runway';
  if (clean.includes('leonardo')) return 'leonardo-ai';
  if (clean.includes('ideogram')) return 'ideogram';
  if (clean.includes('recraft')) return 'recraft';
  return clean.replace(/\s+/g, '-');
}

/**
 * Returns the matching launcher configuration for a given prompt, integrating 
 * tool-defaults with prompt-level overrides.
 */
export function getLauncherConfig(prompt: DBPrompt): LauncherPlatformConfig | null {
  // 1. Determine platform key
  const platformName = prompt.primary_ai_platform || prompt.ai_tool || '';
  if (!platformName) return null;

  const key = normalizePlatformKey(platformName);
  
  // 2. Resolve default config
  const defaultConfig = LAUNCHER_PLATFORMS[key] || GENERIC_PLATFORMS[key] || null;
  
  if (!defaultConfig) {
    // If not found in pre-configured, return a generic config based on available details
    return {
      id: key || 'generic',
      displayName: platformName,
      defaultLaunchUrl: prompt.launch_url || 'https://google.com',
      brandColor: 'bg-zinc-900 hover:bg-zinc-950 text-white focus:ring-zinc-800/20',
      iconSvg: '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2Zm1,14.5h-2v-5h2Zm0-7h-2v-2h2Z"/></svg>'
    };
  }

  // 3. Apply prompt-level overrides
  return {
    id: defaultConfig.id || key,
    displayName: defaultConfig.displayName,
    defaultLaunchUrl: prompt.launch_url || defaultConfig.defaultLaunchUrl,
    brandColor: defaultConfig.brandColor,
    iconSvg: defaultConfig.iconSvg
  };
}

/**
 * Generates the clean formatted text pack from the prompt attributes.
 * Preserves exact formatting and creator content without modification.
 */
export function compilePromptPackage(prompt: DBPrompt): string {
  // If only prompt_text is populated, return it directly to preserve exact format
  if (!prompt.negative_prompt && !prompt.aspect_ratio && (!prompt.generation_settings || Object.keys(prompt.generation_settings).length === 0)) {
    return prompt.prompt_text;
  }

  let pack = '';
  pack += `[PROMPT]\n${prompt.prompt_text}\n\n`;

  if (prompt.negative_prompt) {
    pack += `[NEGATIVE PROMPT]\n${prompt.negative_prompt}\n\n`;
  }

  if (prompt.aspect_ratio && prompt.aspect_ratio !== '1:1') {
    pack += `[ASPECT RATIO]\n${prompt.aspect_ratio}\n\n`;
  }

  if (prompt.generation_settings) {
    // Exclude empty and internal values, format clean settings list
    const settings = { ...prompt.generation_settings };
    delete settings.id;
    delete settings.prompt_id;
    
    const keys = Object.keys(settings);
    if (keys.length > 0) {
      pack += `[PARAMETERS]\n`;
      keys.forEach(k => {
        const val = settings[k];
        if (val !== undefined && val !== null && val !== '') {
          // Format keys cleanly (capitalize or display)
          const keyLabel = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          pack += `${keyLabel}: ${typeof val === 'object' ? JSON.stringify(val) : val}\n`;
        }
      });
    }
  }

  return pack.trim();
}
