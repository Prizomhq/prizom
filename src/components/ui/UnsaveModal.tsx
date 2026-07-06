'use client';

import { X, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface UnsaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function UnsaveModal({ isOpen, onClose, onConfirm }: UnsaveModalProps) {
  const [isRemoving, setIsRemoving] = useState(false);
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

  const handleConfirm = async () => {
    setIsRemoving(true);
    await onConfirm();
    setIsRemoving(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 p-8 text-center relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>

        <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Remove Prompt?</h2>
        <p className="text-zinc-500 font-medium leading-relaxed mb-8">
          This prompt is already saved. Are you sure you want to remove it from your collections?
        </p>

        <div className="flex flex-col space-y-3">
          <button 
            onClick={handleConfirm}
            disabled={isRemoving}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all flex items-center justify-center disabled:opacity-70 shadow-sm"
          >
            {isRemoving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Remove'}
          </button>
          <button 
            onClick={onClose}
            disabled={isRemoving}
            className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition-all disabled:opacity-70"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
