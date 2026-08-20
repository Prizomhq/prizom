'use client';

import { useState } from 'react';
import { 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  BellRing, 
  ShieldAlert, 
  XCircle, 
  ShieldCheck, 
  X 
} from 'lucide-react';

export type BannerVariant = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'action_required' 
  | 'restricted' 
  | 'error' 
  | 'moderation';

interface ActionMessageBannerProps {
  variant: BannerVariant;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export default function ActionMessageBanner({
  variant,
  title,
  description,
  primaryAction,
  secondaryAction,
  dismissible = false,
  onDismiss,
  className = ''
}: ActionMessageBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'info':
        return {
          bg: 'bg-sky-50/80 border-sky-200/80 text-sky-950',
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
          titleColor: 'text-sky-900',
          btnPrimary: 'bg-sky-600 hover:bg-sky-700 text-white',
          btnSecondary: 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-200'
        };
      case 'success':
        return {
          bg: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
          titleColor: 'text-emerald-900',
          btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          btnSecondary: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-200'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/80 border-amber-200/80 text-amber-950',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          titleColor: 'text-amber-900',
          btnPrimary: 'bg-amber-600 hover:bg-amber-700 text-white',
          btnSecondary: 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200'
        };
      case 'action_required':
        return {
          bg: 'bg-indigo-50/90 border-indigo-200/90 text-indigo-950 shadow-xs',
          icon: <BellRing className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />,
          titleColor: 'text-indigo-950',
          btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs',
          btnSecondary: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border-indigo-200'
        };
      case 'restricted':
        return {
          bg: 'bg-rose-50/80 border-rose-200/80 text-rose-950',
          icon: <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />,
          titleColor: 'text-rose-900',
          btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white',
          btnSecondary: 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-200'
        };
      case 'error':
        return {
          bg: 'bg-red-50/90 border-red-200 text-red-950',
          icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
          titleColor: 'text-red-950',
          btnPrimary: 'bg-red-600 hover:bg-red-700 text-white',
          btnSecondary: 'bg-red-100 hover:bg-red-200 text-red-900 border-red-200'
        };
      case 'moderation':
        return {
          bg: 'bg-purple-50/80 border-purple-200/80 text-purple-950',
          icon: <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />,
          titleColor: 'text-purple-950',
          btnPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
          btnSecondary: 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-200'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 transition-all duration-300 relative ${styles.bg} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3.5 flex-1 pr-6 sm:pr-0">
        <div className="mt-0.5">{styles.icon}</div>
        <div className="space-y-1">
          <h4 className={`font-extrabold text-sm tracking-tight ${styles.titleColor}`}>
            {title}
          </h4>
          <p className="text-xs font-semibold leading-relaxed opacity-90">
            {description}
          </p>

          {(primaryAction || secondaryAction) && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {primaryAction && (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${styles.btnPrimary}`}
                >
                  {primaryAction.label}
                </button>
              )}
              {secondaryAction && (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${styles.btnSecondary}`}
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-black/5 text-zinc-400 hover:text-zinc-700 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
