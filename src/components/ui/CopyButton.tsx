'use client';

import { useState, useEffect } from 'react';
import { Copy, CheckCircle2, Lock, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { incrementPromptCopyCount } from '@/app/actions/interactions';
import { useRouter } from 'next/navigation';

interface CopyButtonProps {
  textToCopy: string;
  promptId?: string; // Optional prompt ID to track copies
  label?: string;
  successLabel?: string;
}

export default function CopyButton({ 
  textToCopy, 
  promptId, 
  label = 'Copy Formula', 
  successLabel = 'Formula Copied!' 
}: CopyButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showLoginWall, setShowLoginWall] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      const logged = !!user;
      setIsLoggedIn(logged);
      if (logged && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('prizom_guest_copies');
        } catch (err) {
          console.error('Failed to remove guest copies from localStorage:', err);
        }
      }
    }
    checkUser();
  }, [supabase]);

  const handleCopy = async () => {
    const copyText = textToCopy;
    const currentPromptId = promptId;

    if (isLoggedIn === null) return; // auth state unresolved

    // If guest, enforce copying limit
    if (!isLoggedIn && currentPromptId) {
      let guestCopies: string[] = [];
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('prizom_guest_copies') : null;
        if (stored) {
          guestCopies = JSON.parse(stored);
        }
      } catch (err) {
        guestCopies = [];
      }

      const uniquePromptId = currentPromptId;
      const isAlreadyCopied = guestCopies.includes(uniquePromptId);

      if (!isAlreadyCopied && guestCopies.length >= 5) {
        setShowLoginWall(true);
        return;
      }

      // Record copy ID
      if (!isAlreadyCopied) {
        guestCopies.push(uniquePromptId);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('prizom_guest_copies', JSON.stringify(guestCopies));
          }
        } catch (err) {
          console.error('Failed to write guest copies to localStorage:', err);
        }
      }
    }

    const fireGAEvent = () => {
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'copy_prompt', {
          prompt_id: currentPromptId || 'unknown'
        });
      }
    };

    // Execute copy
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(copyText)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            fireGAEvent();
          })
          .catch((err) => {
            console.error('Failed to copy prompt via writeText:', err);
            const successful = fallbackCopyTextForPrompt(copyText);
            if (successful) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              fireGAEvent();
            }
          });
      } else {
        const successful = fallbackCopyTextForPrompt(copyText);
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          fireGAEvent();
        }
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      const successful = fallbackCopyTextForPrompt(copyText);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        fireGAEvent();
      }
    }

    // Call server action to increment copy stats and handle permission/database failures
    if (currentPromptId) {
      const res = await incrementPromptCopyCount(currentPromptId);
      if (res && !res.success) {
        console.error('Prizom Copy Tracking Database Error:', res.error);
      }
    }
  };

  return (
    <>
      <button 
        onClick={handleCopy}
        className={`flex items-center justify-center space-x-1.5 h-10 px-4 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm shrink-0 w-full sm:w-auto ${
          copied 
            ? 'bg-green-500 text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)] -translate-y-0.5' 
            : 'bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white hover:shadow-[0_8px_25px_rgba(168,85,247,0.3)] hover:-translate-y-0.5'
        }`}
      >
        {copied ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{successLabel}</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Premium Guest Login Wall Modal */}
      {showLoginWall && (
        <div className="fixed inset-0 z-[9999] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-zinc-200 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-250">
            {/* Gradient Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-t-[2.5rem]" />
            
            {/* Close Button */}
            <button 
              onClick={() => setShowLoginWall(false)} 
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-purple-50 rounded-[1.5rem] border border-purple-100 flex items-center justify-center mx-auto mb-6 text-[var(--color-neon-purple)] shadow-sm">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-4 shadow-sm">
              <span className="text-[9px] font-black text-indigo-950 uppercase tracking-widest">Free Account Limit Reached</span>
            </div>

            <h3 className="text-2xl font-black text-zinc-900 mb-3 leading-snug">Limit Reached</h3>
            
            <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-8 max-w-sm mx-auto">
              You&apos;ve reached your free discovery limit. Create an account to continue exploring Prizom.
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowLoginWall(false);
                  router.push('/signup');
                }}
                className="w-full py-4 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)] transition-all hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-1.5"
              >
                Create Free Account
              </button>
              <button 
                onClick={() => {
                  setShowLoginWall(false);
                  router.push('/login');
                }}
                className="w-full py-4 rounded-full text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-all active:scale-98"
              >
                Sign In to existing account
              </button>
            </div>
            
            <p className="mt-6 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              Join 5,000+ creators worldwide
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Standalone Helper Function Outside Component to bypass React Hooks/Immutability strict checks
function fallbackCopyTextForPrompt(text: string): boolean {
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
}

