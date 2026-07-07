'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  EyeOff, 
  Eye, 
  Star, 
  TrendingUp, 
  ShieldAlert, 
  GitFork, 
  Loader2,
  ArrowUpRight,
  ListPlus
} from 'lucide-react';
import { 
  getAdminPromptsList, 
  removePromptAction,
  restorePromptAction,
  togglePromptFeature, 
  updatePromptBoost,
  getExploreSectionsAction,
  assignPromptToSectionAction
} from '@/app/actions/adminActions';

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [hideReason, setHideReason] = useState('');
  const [showHideModal, setShowHideModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostWeight, setBoostWeight] = useState(1.0);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [curatedSections, setCuratedSections] = useState<any[]>([]);

  // Load curated explore sections for the assignments modal
  useEffect(() => {
    getExploreSectionsAction().then(res => {
      if (res.success && res.sections) {
        setCuratedSections(res.sections.filter((s: any) => s.type === 'curated'));
      }
    });
  }, []);

  const handleToggleSectionAssignment = async (sectionId: string, assigned: boolean) => {
    if (!selectedPrompt) return;
    const res = await assignPromptToSectionAction(selectedPrompt.id, sectionId, assigned);
    if (res.success) {
      loadPrompts(searchQuery);
      
      const updatedAssigned = assigned 
        ? [...(selectedPrompt.assignedSections || []), sectionId]
        : (selectedPrompt.assignedSections || []).filter((id: string) => id !== sectionId);
      
      setSelectedPrompt({
        ...selectedPrompt,
        assignedSections: updatedAssigned
      });
    } else {
      alert(res.error || 'Failed to update section assignment.');
    }
  };

  const loadPrompts = (query: string = '') => {
    setLoading(true);
    getAdminPromptsList(query).then(res => {
      if (res.success && res.prompts) {
        setPrompts(res.prompts);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPrompts(searchQuery);
  };

  const handleToggleHide = async (promptToToggle?: any) => {
    const target = promptToToggle || selectedPrompt;
    if (!target) return;
    setSubmitting(true);

    const res = target.isHidden 
      ? await restorePromptAction(target.id)
      : await removePromptAction(target.id, hideReason);

    if (res.success) {
      setShowHideModal(false);
      setHideReason('');
      setSelectedPrompt(null);
      loadPrompts(searchQuery);
    } else {
      alert(res.error || 'Failed to update prompt status.');
    }
    setSubmitting(false);
  };

  const handleToggleFeature = async (promptId: string) => {
    const res = await togglePromptFeature(promptId);
    if (res.success) {
      loadPrompts(searchQuery);
    } else {
      alert(res.error || 'Failed to toggle featured status.');
    }
  };

  const handleApplyBoost = async () => {
    if (!selectedPrompt) return;
    setSubmitting(true);

    const res = await updatePromptBoost(selectedPrompt.id, boostWeight);
    if (res.success) {
      setShowBoostModal(false);
      setSelectedPrompt(null);
      loadPrompts(searchQuery);
    } else {
      alert(res.error || 'Failed to apply boost weight.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-500" />
            Prompt Catalog Control
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Audit platform prompts, trigger star highlights, and configure manual search boosts</p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-4 max-w-xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-zinc-600" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white placeholder-zinc-600 focus:outline-none focus:bg-[#0c0c0e] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs font-bold shadow-inner"
            placeholder="Search prompt by title..."
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
        >
          Filter
        </button>
      </form>

      {/* Prompts Catalog Table */}
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-widest">Loading Catalog...</span>
          </div>
        </div>
      ) : prompts.length === 0 ? (
        <div className="bg-[#121215]/60 border border-zinc-800 p-16 rounded-[2.5rem] text-center max-w-2xl mx-auto">
          <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-black text-zinc-300 uppercase">No Prompts Found</h3>
          <p className="text-zinc-500 text-xs font-semibold mt-1">Try adjusting your filters or query strings.</p>
        </div>
      ) : (
        <div className="bg-[#121215]/60 border border-zinc-800 rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-400 font-semibold border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-[10px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-950/20">
                  <th className="px-6 py-4.5">Prompt Details</th>
                  <th className="px-6 py-4.5">Creator ID</th>
                  <th className="px-6 py-4.5">Remix Ancestry</th>
                  <th className="px-6 py-4.5">Stats Index</th>
                  <th className="px-6 py-4.5">Trending Overrides</th>
                  <th className="px-6 py-4.5 text-right">Moderator Control Panel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {prompts.map((prompt) => (
                  <tr key={prompt.id} className={`hover:bg-zinc-850/5 transition-colors ${prompt.isHidden ? 'bg-red-950/5' : ''}`}>
                    
                    {/* Prompt Title & Image */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        {prompt.imageUrl ? (
                          <img 
                            src={prompt.imageUrl} 
                            alt={prompt.title}
                            className="w-12 h-12 object-cover rounded-xl bg-zinc-800 shrink-0 border border-zinc-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black uppercase text-zinc-500 shrink-0">
                            {prompt.aiTool?.[0] || 'AI'}
                          </div>
                        )}
                        <div className="min-w-0 max-w-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-zinc-200 truncate">{prompt.title}</span>
                            {prompt.isFeatured && (
                              <span className="p-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase" title="Featured Showcase">
                                FEATURED
                              </span>
                            )}
                            {prompt.isHidden ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-red-950/40 text-red-400 border border-red-900/30 text-[8px] font-black uppercase tracking-wider">
                                REMOVED
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 text-[8px] font-black uppercase tracking-wider">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-bold block truncate mt-0.5">{prompt.promptText}</span>
                        </div>
                      </div>
                    </td>

                    {/* Creator Handle */}
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <span className="text-indigo-400 font-bold text-xs">@{prompt.creatorUsername}</span>
                        <span className="text-[10px] text-zinc-500 font-bold block mt-0.5">{prompt.creatorFullName || 'Creator'}</span>
                      </div>
                    </td>

                    {/* Remix Info */}
                    <td className="px-6 py-4">
                      {prompt.remixCount > 0 ? (
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <GitFork className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="text-xs font-bold">{prompt.remixCount} Remix Branches</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-bold">Terminal Prompt</span>
                      )}
                    </td>

                    {/* Stats Metrics */}
                    <td className="px-6 py-4 text-zinc-500">
                      <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                        <span className="text-zinc-300">{prompt.likesCount} ★ Star Likes</span>
                        <span>{prompt.copiesCount} copies triggered</span>
                      </div>
                    </td>

                    {/* Boost details */}
                    <td className="px-6 py-4">
                      {prompt.boostWeight > 1.0 ? (
                        <div className="flex items-center gap-1.5 text-cyan-400">
                          <TrendingUp className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-black">{prompt.boostWeight}x Manual Boost</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-bold">Default Flow</span>
                      )}
                    </td>

                    {/* Actions Panel */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Toggle Featured */}
                        <button
                          onClick={() => handleToggleFeature(prompt.id)}
                          disabled={prompt.isHidden}
                          className={`
                            p-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none
                            ${prompt.isFeatured
                              ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/40 hover:bg-indigo-950/50'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'}
                          `}
                          title={prompt.isFeatured ? 'Unfeature Showcase' : 'Feature Showcase'}
                        >
                          <Star className={`w-4.5 h-4.5 ${prompt.isFeatured ? 'fill-indigo-400 stroke-indigo-400' : ''}`} />
                        </button>

                        {/* Toggle Sections Assignment */}
                        <button
                          onClick={() => {
                            setSelectedPrompt(prompt);
                            setShowSectionsModal(true);
                          }}
                          disabled={prompt.isHidden}
                          className="p-2 rounded-xl border text-xs font-black uppercase tracking-wider bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          title="Assign to Curated Sections"
                        >
                          <ListPlus className="w-4.5 h-4.5" />
                        </button>

                        {/* Adjust Manual Boost */}
                        <button
                          onClick={() => {
                            setSelectedPrompt(prompt);
                            setBoostWeight(prompt.boostWeight);
                            setShowBoostModal(true);
                          }}
                          disabled={prompt.isHidden}
                          className={`
                            p-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none
                            ${prompt.boostWeight > 1.0
                              ? 'bg-cyan-950/30 text-cyan-400 border-cyan-900/40 hover:bg-cyan-950/50'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'}
                          `}
                          title="Configure Trending Boost Weight"
                        >
                          <TrendingUp className="w-4.5 h-4.5" />
                        </button>

                        {/* Toggle Visibility Hide/Show */}
                        <button
                          onClick={() => {
                            if (prompt.isHidden) {
                              handleToggleHide(prompt);
                            } else {
                              setSelectedPrompt(prompt);
                              setShowHideModal(true);
                            }
                          }}
                          className={`
                            p-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all
                            ${prompt.isHidden
                              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/50'
                              : 'bg-red-950/30 text-red-400 border-red-900/40 hover:bg-red-950/50'}
                          `}
                          title={prompt.isHidden ? 'Restore Prompt' : 'Remove Prompt content'}
                        >
                          {prompt.isHidden ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hide Safety Modal */}
      {showHideModal && selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-md bg-[#121215] border border-zinc-800 rounded-[2rem] p-8 shadow-2xl animate-scale-up z-60">
            <div className="flex items-center gap-3.5 mb-6 text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 animate-pulse">
                <EyeOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-wide">Remove Platform Content</h3>
                <p className="text-[10px] text-red-400 font-bold uppercase">Confirm Action on: {selectedPrompt.title}</p>
              </div>
            </div>

            <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-6">
              Removing a prompt hides it from explore, trending leaderboards, collections, and public creator galleries. The author will be notified.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Audit Action Reason</label>
                <textarea
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  required
                  rows={3}
                  className="block w-full px-4 py-3 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all text-xs font-bold shadow-inner"
                  placeholder="Explain guidelines violation (will be sent to prompt author)..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowHideModal(false);
                    setHideReason('');
                    setSelectedPrompt(null);
                  }}
                  className="flex-1 px-6 py-3.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleToggleHide()}
                  disabled={submitting || !hideReason.trim()}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/20 hover:shadow-red-950/40 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? 'Auditing...' : 'Remove Content'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Manual Boost Override Modal */}
      {showBoostModal && selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-md bg-[#121215] border border-zinc-800 rounded-[2rem] p-8 shadow-2xl animate-scale-up z-60">
            <div className="flex items-center gap-3.5 mb-6 text-cyan-400">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-wide">Adjust Trending Boost</h3>
                <p className="text-[10px] text-cyan-400 font-bold uppercase">Manual weight boost: {selectedPrompt.title}</p>
              </div>
            </div>

            <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-6">
              Manually multiplies the like velocity ranking scores in trending feeds. Enter 1.0 to clear overrides and restore automatic algorithmic flows.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Manual Boost Multiplier Weight</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="10.0"
                  value={boostWeight}
                  onChange={(e) => setBoostWeight(parseFloat(e.target.value) || 1.0)}
                  required
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all text-xs font-bold shadow-inner"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowBoostModal(false);
                    setSelectedPrompt(null);
                  }}
                  className="flex-1 px-6 py-3.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyBoost}
                  disabled={submitting}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-950/20 hover:shadow-cyan-950/40 transition-all"
                >
                  {submitting ? 'Applying...' : 'Apply Boost'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Explore Section Assignments Modal */}
      {showSectionsModal && selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-md bg-[#121215] border border-zinc-800 rounded-[2rem] p-8 shadow-2xl animate-scale-up z-60">
            <div className="flex items-center gap-3.5 mb-6 text-indigo-400">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <ListPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-wide">Assign Explore Sections</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase">Section curation: {selectedPrompt.title}</p>
              </div>
            </div>

            <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-6">
              Select which curated explore sections this prompt should appear in. A single prompt can be assigned to multiple sections.
            </p>

            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-2 no-scrollbar mb-6">
              {curatedSections.length === 0 ? (
                <p className="text-zinc-600 text-xs font-bold uppercase">No curated sections defined.</p>
              ) : (
                curatedSections.map((sec) => {
                  const isAssigned = (selectedPrompt.assignedSections || []).includes(sec.id);
                  return (
                    <label 
                      key={sec.id} 
                      className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-850 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/40 cursor-pointer select-none transition-all duration-200"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-200">{sec.title}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-550 mt-0.5">Curated list</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={(e) => handleToggleSectionAssignment(sec.id, e.target.checked)}
                        className="w-5 h-5 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-950"
                      />
                    </label>
                  );
                })
              )}
            </div>

            <button
              onClick={() => {
                setShowSectionsModal(false);
                setSelectedPrompt(null);
              }}
              className="w-full px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all"
            >
              Close Curation Panel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
