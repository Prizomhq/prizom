'use client';

import React from 'react';
import { AlertTriangle, Info, ShieldAlert, Loader2 } from 'lucide-react';

interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isSubmitting?: boolean;
  children?: React.ReactNode;
}

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'danger',
  isSubmitting = false,
  children
}: AdminConfirmDialogProps) {
  if (!isOpen) return null;

  const iconConfig = {
    danger: { Icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-100', button: 'bg-rose-600 hover:bg-rose-700 text-white' },
    warning: { Icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100', button: 'bg-amber-600 hover:bg-amber-700 text-white' },
    info: { Icon: Info, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', button: 'bg-indigo-600 hover:bg-indigo-700 text-white' }
  }[variant];

  const { Icon, color, button } = iconConfig;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Dialog Surface */}
      <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 text-left overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">{description}</p>
          </div>
        </div>

        {children && <div className="mt-4 pt-4 border-t border-zinc-100">{children}</div>}

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 text-xs font-semibold text-zinc-700 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 ${button}`}
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
