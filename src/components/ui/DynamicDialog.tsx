'use client';

import { X, AlertCircle, AlertTriangle, CheckCircle, Info, HelpCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DynamicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
}

export default function DynamicDialog({
  isOpen,
  onClose,
  title,
  description,
  type = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm
}: DynamicDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsPending(true);
      try {
        await onConfirm();
      } catch (err) {
        console.error('Error in dynamic dialog confirm callback:', err);
      } finally {
        setIsPending(false);
      }
    }
    onClose();
  };

  // Resolve design tokens based on dialog type
  let accentColorClass = 'bg-gradient-to-r from-[var(--color-neon-purple)] via-indigo-500 to-[var(--color-electric-blue)]';
  let iconContainerClass = 'bg-indigo-50 text-indigo-500 border border-indigo-100/50';
  let Icon = Info;
  let primaryBtnClass = 'bg-zinc-900 hover:bg-zinc-800 text-white';

  if (type === 'success') {
    accentColorClass = 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500';
    iconContainerClass = 'bg-emerald-50 text-emerald-500 border border-emerald-100/50';
    Icon = CheckCircle;
    primaryBtnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
  } else if (type === 'warning') {
    accentColorClass = 'bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500';
    iconContainerClass = 'bg-amber-50 text-amber-600 border border-amber-100/50';
    Icon = AlertTriangle;
    primaryBtnClass = 'bg-amber-500 hover:bg-amber-600 text-white';
  } else if (type === 'error' || type === 'danger') {
    accentColorClass = 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-500';
    iconContainerClass = 'bg-red-50 text-red-500 border border-red-100/50';
    Icon = AlertCircle;
    primaryBtnClass = 'bg-red-650 hover:bg-red-700 text-white';
  } else if (type === 'confirm') {
    accentColorClass = 'bg-gradient-to-r from-[var(--color-neon-purple)] via-indigo-500 to-[var(--color-electric-blue)]';
    iconContainerClass = 'bg-purple-50 text-[var(--color-neon-purple)] border border-purple-100/50';
    Icon = HelpCircle;
    primaryBtnClass = 'bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg text-white';
  }

  const isConfirmation = typeof onConfirm === 'function';

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 p-8 text-center relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Top Accent */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${accentColorClass}`}></div>

        <button 
          onClick={onClose}
          disabled={isPending}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ${iconContainerClass}`}>
          <Icon className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">{title}</h2>
        <p className="text-zinc-550 font-semibold text-sm leading-relaxed mb-8 whitespace-pre-line">
          {description}
        </p>

        <div className="flex flex-col space-y-3">
          {isConfirmation ? (
            <>
              <button 
                onClick={handleConfirm}
                disabled={isPending}
                className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-75 ${primaryBtnClass}`}
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmLabel}
              </button>
              <button 
                onClick={onClose}
                disabled={isPending}
                className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition-all disabled:opacity-75"
              >
                {cancelLabel}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center ${primaryBtnClass}`}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
