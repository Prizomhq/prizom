'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Copy, 
  CheckCircle2, 
  Lock, 
  X, 
  MoreHorizontal, 
  Download, 
  Share2, 
  Flag, 
  ExternalLink, 
  AlertTriangle 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { incrementPromptCopyCount } from '@/app/actions/interactions';
import { trackLauncherEvent } from '@/app/actions/launcher';
import { getLauncherConfig, compilePromptPackage } from '@/lib/launcher';
import { DBPrompt } from '@/types';
import ShareModal from './ShareModal';
import ReportModal from './ReportModal';

interface AILauncherProps {
  prompt: DBPrompt;
  isLoggedIn: boolean;
  isOwner?: boolean;
}

export default function AILauncher({ prompt, isLoggedIn, isOwner = false }: AILauncherProps) {
  const router = useRouter();
  const supabase = createClient();
  
  // Platform settings
  const config = getLauncherConfig(prompt);
  
  // UI states
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLoginWall, setShowLoginWall] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);
  
  // Modals inside the launcher
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  // Dropdown ref for click outside
  const menuRef = useRef<HTMLDivElement>(null);
  
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Prepares the compiled text package to copy
  const getCompiledContent = () => {
    return compilePromptPackage(prompt);
  };

  // Helper for fallback text area copying when navigator.clipboard fails
  const fallbackCopy = (text: string) => {
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
      return successful;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  };

  const handleLaunch = async () => {
    if (!config) return;
    
    // 1. Track launch click
    await trackLauncherEvent(prompt.id, config.displayName, 'launch_clicked');

    // 2. Enforce guest limits (client-side matching CopyButton.tsx)
    if (!isLoggedIn) {
      let guestCopies: string[] = [];
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('prizom_guest_copies') : null;
        if (stored) {
          guestCopies = JSON.parse(stored);
        }
      } catch (err) {
        guestCopies = [];
      }

      const isAlreadyCopied = guestCopies.includes(prompt.id);
      if (!isAlreadyCopied && guestCopies.length >= 5) {
        setShowLoginWall(true);
        return;
      }

      // Record in guestCopies
      if (!isAlreadyCopied) {
        guestCopies.push(prompt.id);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('prizom_guest_copies', JSON.stringify(guestCopies));
          }
        } catch (err) {
          console.error('Failed to save guest copies:', err);
        }
      }
    }

    const compiledText = getCompiledContent();
    let copySuccessful = false;

    // 3. Execute Copy operation
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(compiledText);
        copySuccessful = true;
      } else {
        copySuccessful = fallbackCopy(compiledText);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      copySuccessful = fallbackCopy(compiledText);
    }

    if (!copySuccessful) {
      await trackLauncherEvent(prompt.id, config.displayName, 'clipboard_failure');
      setManualCopyText(compiledText);
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Call server action to log copy/increment copy counts
    const incrementRes = await incrementPromptCopyCount(prompt.id);
    if (incrementRes && !incrementRes.success) {
      // If server copy limits got exceeded, block the rest of flow and show login wall
      if (incrementRes.error?.includes('limit exceeded')) {
        setShowLoginWall(true);
        return;
      }
    }

    // 4. Open AI Platform URL in a new tab
    setPopupBlocked(false);
    const targetUrl = config.defaultLaunchUrl;
    const newTab = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    
    let isBlocked = false;
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      isBlocked = true;
      setPopupBlocked(true);
      await trackLauncherEvent(prompt.id, config.displayName, 'popup_blocked');
    }

    // 5. Success Flow Onboarding/Toast (delayed to occur after tab transition)
    const onboardingDismissed = typeof window !== 'undefined' ? localStorage.getItem('prizom_launcher_onboarding_dismissed') === 'true' : false;
    
    if (isBlocked) {
      // If blocked by browser popup settings, show fallback warning and a lightweight toast immediately
      showToast(`Prompt copied! Ready to paste.`);
      await trackLauncherEvent(prompt.id, config.displayName, 'launch_success');
    } else {
      // Delay onboarding modal or toast display until after navigation begins and user shifts focus
      setTimeout(async () => {
        if (!onboardingDismissed) {
          setShowOnboarding(true);
          await trackLauncherEvent(prompt.id, config.displayName, 'guide_displayed');
        } else {
          showToast(`Prompt copied. ${config.displayName} opened. Ready to paste.`);
          await trackLauncherEvent(prompt.id, config.displayName, 'launch_success');
        }
      }, 1000);
    }
  };

  const handleRetryLaunch = () => {
    if (!config) return;
    setPopupBlocked(false);
    // Delay post-launch guidance after manual click opens the tab
    setTimeout(async () => {
      const onboardingDismissed = typeof window !== 'undefined' ? localStorage.getItem('prizom_launcher_onboarding_dismissed') === 'true' : false;
      if (!onboardingDismissed) {
        setShowOnboarding(true);
        await trackLauncherEvent(prompt.id, config.displayName, 'guide_displayed');
      } else {
        showToast(`Prompt copied. ${config.displayName} opened. Ready to paste.`);
        await trackLauncherEvent(prompt.id, config.displayName, 'launch_success');
      }
    }, 1000);
  };

  const handleDismissOnboarding = async (skipped = true) => {
    setShowOnboarding(false);
    if (dontShowAgain) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('prizom_launcher_onboarding_dismissed', 'true');
      }
      await trackLauncherEvent(prompt.id, config?.displayName || 'AI', 'guide_completed');
    } else {
      await trackLauncherEvent(prompt.id, config?.displayName || 'AI', skipped ? 'guide_skipped' : 'guide_completed');
    }
    
    showToast(`Prompt copied. Ready to paste.`);
  };

  // Dropdown options
  const handleCopyPromptTextOnly = async () => {
    setMenuOpen(false);
    const text = prompt.prompt_text;
    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      } else {
        success = fallbackCopy(text);
      }
    } catch (err) {
      success = fallbackCopy(text);
    }

    if (success) {
      showToast('Prompt text copied!');
    } else {
      setManualCopyText(text);
    }
  };

  const handleDownloadTxt = () => {
    setMenuOpen(false);
    const text = getCompiledContent();
    const cleanTitle = prompt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `${cleanTitle}-prompt.txt`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Downloaded prompt.txt!');
  };

  if (!config) return null;

  return (
    <>
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={prompt.title}
      />
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        type="prompt"
        entityId={prompt.id}
        entityName={prompt.title}
      />

      <div className="flex flex-col gap-3 w-full">
        {/* Pop-up Blocker Retry Banner */}
        {popupBlocked && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-250 p-4 rounded-xl text-amber-900 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs font-bold leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Pop-up was blocked. Click the button to open {config.displayName} manually.</span>
            </div>
            <a 
              href={config.defaultLaunchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleRetryLaunch}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm shrink-0 inline-flex items-center gap-1"
            >
              <span>Open</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Success Toast */}
        {toastMessage && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-250">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
          {/* Primary CTA Button */}
          <button
            onClick={handleLaunch}
            aria-label={`Use prompt in ${config.displayName}`}
            className={`flex-1 sm:flex-initial h-10 px-4 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
              copied
                ? 'bg-green-500 text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)]'
                : config.brandColor
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Prompt Copied!</span>
              </>
            ) : (
              <>
                <span dangerouslySetInnerHTML={{ __html: config.iconSvg }} />
                <span>Use in {config.displayName}</span>
              </>
            )}
          </button>

          {/* Secondary 3-Dot Options Menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Prompt options menu"
              aria-expanded={menuOpen}
              className={`h-10 w-10 rounded-xl border transition-all duration-300 shadow-sm flex items-center justify-center shrink-0 cursor-pointer ${
                menuOpen
                  ? 'bg-zinc-950 text-white border-zinc-950'
                  : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div 
                className="absolute right-0 mt-2 w-44 bg-white/95 border border-zinc-200/50 rounded-xl shadow-xl backdrop-blur-md py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={handleCopyPromptTextOnly}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  Copy Prompt
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-t border-zinc-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  Download TXT
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsShareOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-t border-zinc-100 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                  Share Prompt
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsReportOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50/50 flex items-center gap-2 border-t border-zinc-100 mt-1 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Flag Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Onboarding Wizard Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[99999] bg-zinc-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-white/50 w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative p-6 text-center">
            {/* Top Indigo Ribbon Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-t-[2rem]" />
            
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => handleDismissOnboarding(true)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xl font-black text-zinc-900 mb-2 leading-tight tracking-tight uppercase">
              Prompt Ready
            </h3>
            
            <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-5 max-w-xs mx-auto">
              The prompt has been copied to your clipboard. You are ready to paste it in {config.displayName}!
            </p>

            {/* Quick Keyboard/Tap Shortcut Reference */}
            <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-3.5 mb-5 text-left space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-zinc-500">Desktop</span>
                <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded shadow-sm font-sans font-black text-zinc-800 text-[10px]">Ctrl + V</kbd>
              </div>
              <div className="flex items-center justify-between text-[11px] border-t border-zinc-200/50 pt-2">
                <span className="font-bold text-zinc-500">Mac</span>
                <kbd className="px-2 py-0.5 bg-white border border-zinc-300 rounded shadow-sm font-sans font-black text-zinc-800 text-[10px]">⌘ + V</kbd>
              </div>
              <div className="flex items-center justify-between text-[11px] border-t border-zinc-200/50 pt-2">
                <span className="font-bold text-zinc-500">Mobile</span>
                <span className="font-black text-zinc-850 text-[9px] uppercase tracking-wider bg-white px-2 py-0.5 border border-zinc-300 rounded shadow-sm">Tap & Hold → Paste</span>
              </div>
            </div>

            {/* Don't show again checkbox */}
            <label className="flex items-center justify-center gap-2 mb-5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-[var(--color-neon-purple)] focus:ring-[var(--color-neon-purple)] cursor-pointer"
              />
              <span className="text-xs font-bold text-zinc-600">Don&apos;t show this again</span>
            </label>

            <button
              onClick={() => handleDismissOnboarding(false)}
              className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-0.5 active:scale-98 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* 2. Clipboard Fallback Modal (Manual Copy) */}
      {manualCopyText !== null && (
        <div className="fixed inset-0 z-[99999] bg-zinc-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-white/50 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative p-6">
            {/* Close Button */}
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setManualCopyText(null)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xl font-black text-zinc-900 mb-2 text-center uppercase tracking-wide">Copy Prompt</h3>
            <p className="text-zinc-550 text-xs font-semibold leading-relaxed mb-4 text-center">
              We couldn&apos;t automatically copy to your clipboard. Please select the text below and copy it manually.
            </p>

            <textarea 
              readOnly 
              value={manualCopyText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="w-full h-40 p-4 font-mono text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 shadow-inner resize-none mb-4"
            />

            <button
              onClick={() => {
                fallbackCopy(manualCopyText);
                setManualCopyText(null);
                showToast('Prompt copied!');
              }}
              className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              Copy and Close
            </button>
          </div>
        </div>
      )}

      {/* 3. Login Wall Modal */}
      {showLoginWall && (
        <div className="fixed inset-0 z-[99999] bg-zinc-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-white/50 w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative p-6 text-center">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-t-[2rem]" />
            
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setShowLoginWall(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-14 h-14 bg-purple-50 rounded-[1.25rem] border border-purple-100 flex items-center justify-center mx-auto mb-4 text-[var(--color-neon-purple)] shadow-sm">
              <Lock className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-4 shadow-sm">
              <span className="text-[9px] font-black text-indigo-950 uppercase tracking-widest">Free Account Limit Reached</span>
            </div>

            <h3 className="text-xl font-black text-zinc-900 mb-2 leading-none uppercase tracking-tight">Limit Reached</h3>
            <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-6 max-w-xs mx-auto">
              You&apos;ve reached your free copy/launch limit today. Create an account or sign in to continue using prompts.
            </p>

            <div className="space-y-2.5">
              <button 
                onClick={() => {
                  setShowLoginWall(false);
                  router.push('/signup');
                }}
                className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Create Free Account
              </button>
              <button 
                onClick={() => {
                  setShowLoginWall(false);
                  router.push('/login');
                }}
                className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-all active:scale-98 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
