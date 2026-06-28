'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Lock, Globe, Trash2, Loader2, ChevronDown, Check } from 'lucide-react';
import { deleteCollectionAction, toggleCollectionVisibilityAction } from '@/app/actions/interactions';
import DynamicDialog from '@/components/ui/DynamicDialog';

interface CollectionHeaderClientProps {
  collectionId: string;
  initialIsPrivate: boolean;
  collectionName: string;
  promptCount: number;
}

export default function CollectionHeaderClient({
  collectionId,
  initialIsPrivate,
  collectionName,
  promptCount
}: CollectionHeaderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'confirm' | 'danger';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  });

  const handleToggleVisibility = (targetPrivate: boolean) => {
    if (targetPrivate === isPrivate) {
      setIsDropdownOpen(false);
      return;
    }
    setIsDropdownOpen(false);

    startTransition(async () => {
      const res = await toggleCollectionVisibilityAction(collectionId, targetPrivate);
      if (res.success) {
        setIsPrivate(targetPrivate);
      } else {
        setDialogConfig({
          isOpen: true,
          title: 'Update Failed',
          description: res.error || 'Failed to update visibility.',
          type: 'error'
        });
      }
    });
  };

  const executeDelete = async () => {
    startTransition(async () => {
      const res = await deleteCollectionAction(collectionId);
      if (res.success) {
        router.push('/profile');
        router.refresh();
      } else {
        setDialogConfig({
          isOpen: true,
          title: 'Delete Failed',
          description: res.error || 'Failed to delete collection.',
          type: 'error'
        });
      }
    });
  };

  const handleDelete = () => {
    setDialogConfig({
      isOpen: true,
      title: 'Delete Collection?',
      description: `Are you sure you want to delete the collection "${collectionName}"? All prompts inside will be unsaved. This cannot be undone.`,
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: executeDelete
    });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-zinc-200 pb-8 gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Bookmark className="w-5 h-5 text-[var(--color-electric-blue)]" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">{collectionName}</h1>
          
          {/* Privacy badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isPrivate 
              ? 'bg-zinc-100 text-zinc-650 border border-zinc-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}>
            {isPrivate ? (
              <>
                <Lock className="w-3 h-3" />
                Private
              </>
            ) : (
              <>
                <Globe className="w-3 h-3" />
                Public
              </>
            )}
          </span>
        </div>
        <p className="text-zinc-500 font-medium ml-0 md:ml-13">
          {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-end">
        {/* Visibility toggle dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isPending}
            className="px-4 py-2.5 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isPrivate ? (
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Visibility</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                onClick={() => handleToggleVisibility(false)}
                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-zinc-50 flex items-center justify-between text-zinc-700"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🌍 Public</span>
                </div>
                {!isPrivate && <Check className="w-3.5 h-3.5 text-[var(--color-neon-purple)]" />}
              </button>
              <button
                onClick={() => handleToggleVisibility(true)}
                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-zinc-50 flex items-center justify-between text-zinc-700 border-t border-zinc-100"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>🔒 Private</span>
                </div>
                {isPrivate && <Check className="w-3.5 h-3.5 text-[var(--color-neon-purple)]" />}
              </button>
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex items-center gap-1.5 border border-red-100"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          <span>Delete Collection</span>
        </button>
      </div>

      <DynamicDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
        title={dialogConfig.title}
        description={dialogConfig.description}
        type={dialogConfig.type}
        confirmLabel={dialogConfig.confirmLabel}
        cancelLabel={dialogConfig.cancelLabel}
        onConfirm={dialogConfig.onConfirm}
      />
    </div>
  );
}
