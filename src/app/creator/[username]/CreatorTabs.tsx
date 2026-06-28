'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Grid, Bookmark, Image as ImageIcon, Sparkles, FolderPlus, Repeat, AlertTriangle, X } from 'lucide-react';
import MasonryGrid from '@/components/ui/MasonryGrid';
import PromptCard from '@/components/ui/PromptCard';
import { getOptimizedImageUrl } from '@/lib/cloudinary-client';
import { submitPromptAppealAction } from '@/app/actions/appealActions';

interface CreatorTabsProps {
  prompts: any[];
  remixes: any[];
  collections: any[];
  removedPrompts?: any[];
  isOwnProfile?: boolean;
}

export default function CreatorTabs({ 
  prompts, 
  remixes, 
  collections, 
  removedPrompts = [], 
  isOwnProfile = false 
}: CreatorTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'prompts' | 'remixes' | 'collections' | 'removed'>('prompts');
  
  // Appeal Modal State
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState('');
  const [appealSuccess, setAppealSuccess] = useState('');

  const tabs = [
    { id: 'prompts', label: 'Prompts', icon: Grid, count: prompts.length },
    { id: 'remixes', label: 'Remixes', icon: Repeat, count: remixes.length },
    { id: 'collections', label: 'Collections', icon: Bookmark, count: collections.length },
  ];

  if (isOwnProfile) {
    tabs.push({ id: 'removed', label: 'Removed Content', icon: AlertTriangle, count: removedPrompts.length });
  }

  const handleOpenAppeal = (prompt: any) => {
    setSelectedPrompt(prompt);
    setAppealReason('');
    setAppealError('');
    setAppealSuccess('');
    setShowAppealModal(true);
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrompt) return;
    if (!appealReason.trim()) {
      setAppealError('Please specify the reason for your appeal.');
      return;
    }

    setSubmittingAppeal(true);
    setAppealError('');

    try {
      const res = await submitPromptAppealAction(selectedPrompt.id, appealReason);
      if (res.success) {
        setAppealSuccess('Your appeal has been submitted successfully.');
        setTimeout(() => {
          setShowAppealModal(false);
          router.refresh();
        }, 1500);
      } else {
        setAppealError(res.error || 'Failed to submit appeal. Please try again.');
      }
    } catch (err: any) {
      setAppealError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  return (
    <div className="w-full">
      {/* Tabs Header */}
      <div className="sticky top-[72px] z-30 bg-white/80 backdrop-blur-xl border-t border-b border-zinc-200/50 shadow-sm mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
          <div className="flex justify-start md:justify-start space-x-2 md:space-x-8 flex-nowrap whitespace-nowrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-4 border-b-2 font-bold text-sm uppercase tracking-wider transition-all duration-300 shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[var(--color-neon-purple)] text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-[var(--color-neon-purple)]' : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-[var(--color-neon-purple)]/10 text-[var(--color-neon-purple)]' : 'bg-zinc-100'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          prompts.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-zinc-200/60 shadow-sm relative overflow-hidden max-w-4xl mx-auto">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] blur-[100px] opacity-[0.05] pointer-events-none"></div>
              {isOwnProfile ? (
                <>
                  <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-[var(--color-neon-purple)]/10 to-[var(--color-electric-blue)]/10 border border-[var(--color-neon-purple)]/20 shadow-inner">
                    <Sparkles className="w-10 h-10 text-[var(--color-neon-purple)]" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-zinc-900 tracking-tight">Share your first prompt</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                    Your creative work deserves an audience. Publish your first AI prompt and join the Prizom creator community.
                  </p>
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white text-sm font-bold hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)] transition-all hover:-translate-y-0.5 mt-6"
                  >
                    Create Your First Prompt
                  </Link>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-inner">
                    <Sparkles className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-zinc-900 tracking-tight">No prompts yet</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                    This creator hasn&apos;t published any prompts yet. Follow them to get notified when they do.
                  </p>
                </>
              )}
            </div>
          ) : (
            <MasonryGrid>
              {prompts.map((prompt: any) => (
                <PromptCard 
                  key={prompt.id} 
                  id={prompt.id}
                  title={prompt.title}
                  imageUrl={prompt.image_url}
                  tool={prompt.ai_tool}
                  creator={{ 
                    username: prompt.profiles?.username || 'unknown',
                    displayName: prompt.profiles?.full_name,
                    avatarUrl: prompt.profiles?.avatar_url,
                    badges: prompt.profiles?.badges
                  }}
                  likes={prompt.likes_count}
                  saves={prompt.saves_count}
                  description={prompt.description}
                  tags={prompt.tags}
                  remixOf={prompt.remix_of}
                  remixCount={prompt.remix_count}
                  category={prompt.category}
                />
              ))}
            </MasonryGrid>
          )
        )}

        {/* Remixes Tab */}
        {activeTab === 'remixes' && (
          remixes.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-zinc-200/60 shadow-sm relative overflow-hidden max-w-4xl mx-auto">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] blur-[100px] opacity-[0.05] pointer-events-none"></div>
              {isOwnProfile ? (
                <>
                  <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-inner">
                    <Repeat className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-zinc-900 tracking-tight">No remixes yet</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                    Find a prompt you love and remix it with your own twist. Remixes help you build on the community&apos;s creative work.
                  </p>
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white text-sm font-bold hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)] transition-all hover:-translate-y-0.5 mt-6"
                  >
                    Browse Prompts to Remix
                  </Link>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-inner">
                    <Repeat className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-zinc-900 tracking-tight">No remixes yet</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                    This creator hasn&apos;t remixed any prompts yet.
                  </p>
                </>
              )}
            </div>
          ) : (
            <MasonryGrid>
              {remixes.map((prompt: any) => (
                <PromptCard 
                  key={prompt.id} 
                  id={prompt.id}
                  title={prompt.title}
                  imageUrl={prompt.image_url}
                  tool={prompt.ai_tool}
                  creator={{ 
                    username: prompt.profiles?.username || 'unknown',
                    displayName: prompt.profiles?.full_name,
                    avatarUrl: prompt.profiles?.avatar_url,
                    badges: prompt.profiles?.badges
                  }}
                  likes={prompt.likes_count}
                  saves={prompt.saves_count}
                  description={prompt.description}
                  tags={prompt.tags}
                  remixOf={prompt.remix_of}
                  remixCount={prompt.remix_count}
                  category={prompt.category}
                />
              ))}
            </MasonryGrid>
          )
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          collections.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-zinc-200/60 shadow-sm relative overflow-hidden max-w-4xl mx-auto">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] blur-[100px] opacity-[0.05] pointer-events-none"></div>
              {isOwnProfile ? (
                <>
                  <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-inner">
                    <FolderPlus className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-zinc-900 tracking-tight">Create your first collection</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                    Organize prompts you love into curated collections. Collections help others discover themed prompt sets.
                  </p>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] text-white text-sm font-bold hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)] transition-all hover:-translate-y-0.5 mt-6"
                  >
                    Manage Collections
                  </Link>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-inner">
                    <FolderPlus className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-zinc-900 tracking-tight">No collections</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                    This creator hasn&apos;t made any public collections yet.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {collections.map((col) => {
                const promptCount = col.saved_prompts?.length || 0;
                let coverImage = null;
                if (promptCount > 0 && col.saved_prompts[0].prompts?.image_url) {
                  coverImage = col.saved_prompts[0].prompts.image_url;
                }

                return (
                  <Link 
                    href={`/profile/collection/${col.id}`} 
                    key={col.id}
                    className="group block bg-white rounded-[2rem] overflow-hidden border border-zinc-200 hover:border-[var(--color-neon-purple)]/50 transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden p-2">
                      <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                        {coverImage ? (
                          <img 
                            src={getOptimizedImageUrl(coverImage, 'card')} 
                            alt={col.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                            <Bookmark className="w-12 h-12 text-zinc-200" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                    <div className="p-6 pt-5 text-center">
                      <h3 className="text-lg font-black text-zinc-900 mb-1 group-hover:text-[var(--color-neon-purple)] transition-colors tracking-tight line-clamp-1">{col.name}</h3>
                      <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider">
                        {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}

        {/* Removed Content Tab */}
        {activeTab === 'removed' && (
          removedPrompts.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-zinc-200/60 shadow-sm relative overflow-hidden max-w-4xl mx-auto">
              <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-inner">
                <AlertTriangle className="w-10 h-10 text-zinc-300" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-zinc-900 tracking-tight">No removed content</h3>
              <p className="text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                Prompts removed by moderation will appear here for your review and appeal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {removedPrompts.map((prompt: any) => (
                <div 
                  key={prompt.id} 
                  className="relative bg-white rounded-[2.5rem] overflow-hidden border-2 border-red-200/80 shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between"
                >
                  <div>
                    {prompt.image_url ? (
                      <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-4 bg-zinc-100">
                        <img 
                          src={getOptimizedImageUrl(prompt.image_url, 'card')} 
                          alt={prompt.title} 
                          className="w-full h-full object-cover grayscale opacity-60" 
                        />
                        <div className="absolute inset-0 bg-red-950/10 mix-blend-multiply"></div>
                      </div>
                    ) : (
                      <div className="aspect-[4/3] rounded-[2rem] mb-4 bg-red-50 flex items-center justify-center border border-red-100/50">
                        <ImageIcon className="w-12 h-12 text-red-300" />
                      </div>
                    )}
                    
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2 line-clamp-1">{prompt.title}</h3>
                    
                    <div className="bg-red-50/50 border border-red-100/50 rounded-2xl p-4 mb-4">
                      <p className="text-xs uppercase tracking-wider text-red-500 font-extrabold mb-1">Removal Reason</p>
                      <p className="text-sm text-red-900 font-semibold leading-relaxed italic">"{prompt.moderation_reason || 'Policy violation'}"</p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-bold text-zinc-500 mb-4">
                      <span>Removed: {new Date(prompt.moderated_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    {/* Expiry countdown banner */}
                    {(() => {
                      const moderatedDate = new Date(prompt.moderated_at);
                      const expiryDate = new Date(moderatedDate.getTime() + 15 * 24 * 60 * 60 * 1000);
                      const diffMs = expiryDate.getTime() - Date.now();
                      const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                      
                      return (
                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 flex items-center justify-between mb-4">
                          <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-wide">Grace Period</span>
                          <span className={`text-xs font-black ${diffDays <= 3 ? 'text-red-600 animate-pulse' : 'text-zinc-700'}`}>
                            {diffDays} {diffDays === 1 ? 'day left' : 'days left'}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Appeal Status / Action */}
                    {prompt.prompt_appeals?.[0] ? (
                      <div className="w-full text-center">
                        {prompt.prompt_appeals[0].status === 'pending' && (
                          <span className="inline-flex w-full justify-center px-4 py-3.5 rounded-full bg-amber-50 border border-amber-100 text-amber-800 font-extrabold text-sm tracking-wide">
                            Appeal Pending Review
                          </span>
                        )}
                        {prompt.prompt_appeals[0].status === 'approved' && (
                          <span className="inline-flex w-full justify-center px-4 py-3.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 font-extrabold text-sm tracking-wide">
                            Appeal Approved
                          </span>
                        )}
                        {prompt.prompt_appeals[0].status === 'rejected' && (
                          <span className="inline-flex w-full justify-center px-4 py-3.5 rounded-full bg-red-50 border border-red-100 text-red-800 font-extrabold text-sm tracking-wide">
                            Appeal Rejected
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenAppeal(prompt)}
                        className="w-full py-3.5 px-4 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm tracking-wider uppercase shadow-md hover:shadow-red-500/10 transition-all duration-200"
                      >
                        Appeal Removal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>

      {/* Appeal Modal */}
      {showAppealModal && selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-zinc-200 shadow-2xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 blur-[80px] pointer-events-none -z-10"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  Appeal Removal
                </h3>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide mt-1">
                  For: {selectedPrompt.title}
                </p>
              </div>
              <button 
                onClick={() => setShowAppealModal(false)}
                className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAppealSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-extrabold text-zinc-700 mb-2 uppercase tracking-wide">
                  Why should this prompt be restored?
                </label>
                <textarea
                  rows={4}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain clearly how this content adheres to Prizom guidelines or correct any misunderstandings..."
                  className="w-full rounded-2xl border border-zinc-200 p-4 text-sm font-medium text-zinc-850 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-1 focus:ring-[var(--color-neon-purple)] transition-all resize-none"
                  disabled={submittingAppeal}
                />
              </div>

              {appealError && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-800 text-sm font-semibold">
                  {appealError}
                </div>
              )}

              {appealSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-800 text-sm font-semibold">
                  {appealSuccess}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="flex-1 py-3 px-4 rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-sm transition-all"
                  disabled={submittingAppeal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-full bg-[var(--color-neon-purple)] hover:bg-[var(--color-neon-purple)]/90 active:scale-95 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-md shadow-purple-500/10"
                  disabled={submittingAppeal}
                >
                  {submittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
