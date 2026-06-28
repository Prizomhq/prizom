'use client';

import { useState } from 'react';
import { Eye, EyeOff, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { hidePromptUser } from '@/app/actions/hiddenActions';
import Link from 'next/link';
import DynamicDialog from '@/components/ui/DynamicDialog';

interface HiddenPromptGridProps {
  initialPrompts: any[];
}

export default function HiddenPromptGrid({ initialPrompts }: HiddenPromptGridProps) {
  const [prompts, setPrompts] = useState<any[]>(initialPrompts);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUnhide = async (promptId: string) => {
    setLoadingId(promptId);
    
    // Call server-action
    const res = await hidePromptUser(promptId, false);
    if (res.success) {
      triggerToast('Prompt successfully restored to your public feeds.');
      // Remove from active state grid
      setPrompts(prev => prev.filter(p => p.id !== promptId));
    } else {
      setErrorDialog({
        isOpen: true,
        message: res.error || 'Failed to unhide prompt.'
      });
    }
    setLoadingId(null);
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3.5 rounded-full shadow-2xl font-bold text-xs uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="py-24 px-6 text-center bg-white border border-zinc-200/50 rounded-[2.5rem] shadow-sm max-w-2xl mx-auto flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-center justify-center mb-6 text-emerald-500 shadow-sm animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2">All Content Restored</h3>
          <p className="text-zinc-500 font-semibold text-sm max-w-xs mb-8">
            Excellent! You have restored all prompt templates to your active platform feeds.
          </p>
          <Link 
            href="/discover" 
            className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all"
          >
            Go to Discover Feed
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {prompts.map((prompt) => (
            <div 
              key={prompt.id} 
              className="bg-white border border-zinc-200/60 rounded-[2rem] p-4 flex flex-col h-full shadow-sm hover:shadow-lg transition-all group relative"
            >
              {/* Cover Image */}
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 relative mb-4 border border-zinc-100 shrink-0">
                <img 
                  src={prompt.image_url} 
                  alt={prompt.title} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                
                {/* Hidden filter badge */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="flex items-center gap-1 bg-black/75 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-zinc-300 border border-white/10">
                    <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                    Hidden Content
                  </span>
                </div>
              </div>

              {/* Title & Author */}
              <div className="flex-1 flex flex-col justify-between px-1">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-neon-purple)]">{prompt.ai_tool}</span>
                  <h3 className="font-extrabold text-zinc-900 text-sm leading-snug line-clamp-1 mt-0.5">{prompt.title}</h3>
                  <span className="block text-[10px] text-zinc-400 font-semibold mt-1 truncate">By @{prompt.profiles?.username}</span>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100">
                  <button
                    onClick={() => handleUnhide(prompt.id)}
                    disabled={loadingId === prompt.id}
                    className="w-full py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-900 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loadingId === prompt.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Unhide Prompt
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
      <DynamicDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog(prev => ({ ...prev, isOpen: false }))}
        title="Error Restoring Prompt"
        description={errorDialog.message}
        type="error"
      />
    </>
  );
}
