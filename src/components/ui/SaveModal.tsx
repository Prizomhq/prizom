'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bookmark, Plus, Loader2, Image as ImageIcon, Sparkles, FolderPlus } from 'lucide-react';
import { getUserCollections, createCollection, togglePromptInCollection } from '@/app/actions/interactions';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  onSaveSuccess?: () => void;
}

export default function SaveModal({ isOpen, onClose, promptId, onSaveSuccess }: SaveModalProps) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manage body scroll and portal mounting
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setLoading(true);
      setErrorMsg(null);
      getUserCollections(promptId)
        .then(data => setCollections(data))
        .catch(err => {
          console.error(err);
          setErrorMsg('Failed to fetch collections');
        })
        .finally(() => setLoading(false));
    } else {
      document.body.style.overflow = 'unset';
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsPrivate(false);
      setIsCreating(false);
      setErrorMsg(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, promptId]);

  if (!isOpen || !mounted) return null;

  const handleToggle = async (collectionId: string, currentlySaved: boolean) => {
    setTogglingId(collectionId);
    setErrorMsg(null);
    
    // Optimistic UI update
    setCollections(prev => prev.map(c => 
      c.id === collectionId ? { ...c, isSaved: !currentlySaved } : c
    ));

    const res = await togglePromptInCollection(promptId, collectionId, !currentlySaved);
    if (!res.success) {
      setCollections(prev => prev.map(c => 
        c.id === collectionId ? { ...c, isSaved: currentlySaved } : c
      ));
      setErrorMsg(res.error || 'Failed to toggle save');
    } else if (!currentlySaved && onSaveSuccess) {
      onSaveSuccess();
    }
    
    setTogglingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    
    setIsCreating(true);
    setErrorMsg(null);
    
    const res = await createCollection(newCollectionName.trim(), newCollectionDescription.trim(), isPrivate);
    
    if (res.success && res.collection) {
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsPrivate(false);
      
      const newCol = { ...res.collection, isSaved: true };
      setCollections([newCol, ...collections]);
      
      const toggleRes = await togglePromptInCollection(promptId, res.collection.id, true);
      if (!toggleRes.success) {
        setErrorMsg('Created collection, but failed to save prompt into it.');
      } else if (onSaveSuccess) {
        onSaveSuccess();
      }
    } else {
      setErrorMsg(res.error || 'Failed to create collection. Make sure the name is unique.');
    }
    setIsCreating(false);
  };

  const isFirstTime = collections.length === 0;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`bg-white rounded-[2rem] w-full ${isFirstTime && !loading ? 'max-w-md' : 'max-w-md'} max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative`}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-electric-blue)] mb-4" />
            <p className="text-zinc-500 font-bold">Loading your collections...</p>
          </div>
        ) : isFirstTime ? (
          // FIRST TIME VIEW
          <div className="p-8 pt-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--color-neon-purple)]/30">
              <FolderPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">Create your first collection</h2>
            <p className="text-zinc-500 font-medium mb-8">
              Organize your favorite prompts by creating a collection. e.g. "Cinematic Prompts"
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Collection Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cinematic Prompts, Coding Formulas..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-1 focus:ring-[var(--color-neon-purple)] text-base font-bold bg-zinc-50 shadow-inner transition-shadow placeholder:font-medium placeholder:text-zinc-400"
                  disabled={isCreating}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Description <span className="font-medium text-zinc-400 lowercase">(Optional)</span></label>
                <textarea
                  placeholder="What is this collection for?"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-1 focus:ring-[var(--color-neon-purple)] text-sm font-medium bg-zinc-50 shadow-inner transition-shadow resize-none h-24 placeholder:text-zinc-400"
                  disabled={isCreating}
                />
              </div>

              {/* Visibility Selector */}
              <div className="flex flex-col">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Visibility</label>
                <select
                  value={isPrivate ? 'private' : 'public'}
                  onChange={(e) => setIsPrivate(e.target.value === 'private')}
                  className="w-full px-5 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-1 focus:ring-[var(--color-neon-purple)] text-sm font-bold bg-zinc-50 shadow-inner transition-shadow text-zinc-800 cursor-pointer"
                  disabled={isCreating}
                >
                  <option value="public">🌍 Public Collection</option>
                  <option value="private">🔒 Private Collection</option>
                </select>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newCollectionName.trim()}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(157,78,221,0.4)] transition-all flex items-center justify-center disabled:opacity-50 hover:-translate-y-0.5"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create & Save'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // HAS COLLECTIONS VIEW
          <div className="flex flex-col overflow-hidden flex-1">
            <div className="p-6 border-b border-zinc-100 shrink-0 pr-16">
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Save Prompt</h2>
            </div>
            
            {/* Create inline */}
            <div className="p-6 bg-zinc-50 border-b border-zinc-100 shrink-0">
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Create a new collection..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-1 focus:ring-[var(--color-neon-purple)] text-sm font-bold shadow-inner bg-white"
                    disabled={isCreating}
                  />
                  <button
                    type="submit"
                    disabled={isCreating || !newCollectionName.trim()}
                    className="px-5 py-3 rounded-xl font-bold text-white bg-zinc-900 hover:bg-black transition-all flex items-center justify-center disabled:opacity-50 hover:shadow-lg"
                  >
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Visibility:</span>
                  <select
                    value={isPrivate ? 'private' : 'public'}
                    onChange={(e) => setIsPrivate(e.target.value === 'private')}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold bg-white focus:outline-none text-zinc-700 cursor-pointer"
                    disabled={isCreating}
                  >
                    <option value="public">🌍 Public</option>
                    <option value="private">🔒 Private</option>
                  </select>
                </div>
              </form>
              {errorMsg && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* List */}
            <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] overflow-y-auto flex-1">
              <p className="px-2 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">All Collections</p>
              <div className="space-y-2">
                {collections.map((col) => {
                  const promptCount = col.saved_prompts?.length || 0;
                  const coverImage = promptCount > 0 && col.saved_prompts[0]?.prompts?.image_url 
                    ? col.saved_prompts[0].prompts.image_url 
                    : null;

                  return (
                    <div
                      key={col.id}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                        col.isSaved ? 'bg-[var(--color-neon-purple)]/5 border-[var(--color-neon-purple)]/20 hover:bg-[var(--color-neon-purple)]/10' : 'bg-transparent border-transparent hover:bg-zinc-50'
                      }`}
                      onClick={() => handleToggle(col.id, col.isSaved)}
                    >
                      <div className="flex items-center space-x-4 overflow-hidden px-2">
                        <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm border border-zinc-200/50">
                          {coverImage ? (
                            <img src={coverImage} alt={col.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-zinc-300" />
                          )}
                          {col.isSaved && (
                            <div className="absolute inset-0 bg-[var(--color-neon-purple)]/80 flex items-center justify-center">
                              <Bookmark className="w-5 h-5 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold truncate text-[15px] mb-0.5 flex items-center gap-1.5 ${col.isSaved ? 'text-[var(--color-neon-purple)]' : 'text-zinc-900'}`}>
                            {col.name}
                            {col.is_private && <span className="text-[10px] text-zinc-450" title="Private collection">🔒</span>}
                          </span>
                          <span className="text-xs font-medium text-zinc-500">
                            {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        disabled={togglingId === col.id}
                        className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          col.isSaved 
                            ? 'bg-[var(--color-neon-purple)]/20 text-[var(--color-neon-purple)] hover:bg-[var(--color-neon-purple)]/30' 
                            : 'bg-zinc-950 text-white hover:bg-zinc-800 hover:shadow-md'
                        }`}
                      >
                        {togglingId === col.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : col.isSaved ? (
                          'Saved'
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
