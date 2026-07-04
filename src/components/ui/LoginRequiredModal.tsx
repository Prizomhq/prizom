'use client';

import { X, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function LoginRequiredModal({ 
  isOpen, 
  onClose,
  title = 'Authentication Required',
  description = 'Create Prizom account to like prompts, build collections, remix ideas, and join the community.'
}: LoginRequiredModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSignUp = () => {
    onClose();
    router.push('/signup');
  };

  const handleLogIn = () => {
    onClose();
    router.push('/login');
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 p-8 text-center relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-neon-purple)] via-indigo-500 to-[var(--color-electric-blue)]"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100/50">
          <Lock className="w-10 h-10 text-[var(--color-neon-purple)]" />
        </div>

        <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">{title}</h2>
        <p className="text-zinc-500 font-semibold text-sm leading-relaxed mb-8">
          {description}
        </p>

        <div className="flex flex-col space-y-3">
          <button 
            onClick={handleSignUp}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg hover:shadow-purple-500/20 text-white font-bold transition-all flex items-center justify-center"
          >
            Sign Up
          </button>
          <button 
            onClick={handleLogIn}
            className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition-all border border-zinc-200/50"
          >
            Log In
          </button>
          <button 
            onClick={onClose}
            className="w-full py-2.5 text-zinc-400 hover:text-zinc-650 font-bold text-xs transition-colors hover:underline"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
