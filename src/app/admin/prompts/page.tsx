'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ListPlus,
  ExternalLink
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
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminDataTable, { Column } from '@/components/admin/ui/AdminDataTable';
import AdminStatusBadge from '@/components/admin/ui/AdminStatusBadge';
import AdminSlideOver from '@/components/admin/ui/AdminSlideOver';
import AdminConfirmDialog from '@/components/admin/ui/AdminConfirmDialog';

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inspection side-drawer states
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);

  // Moderation removal modal states
  const [hideReason, setHideReason] = useState('');
  const [showHideModal, setShowHideModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetPromptForHide, setTargetPromptForHide] = useState<any>(null);

  // Boost modal states
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostWeight, setBoostWeight] = useState(1.0);

  // Section assignment modal states
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

  const handleToggleHide = async () => {
    const target = targetPromptForHide || selectedPrompt;
    if (!target) return;
    setSubmitting(true);

    const res = target.isHidden 
      ? await restorePromptAction(target.id)
      : await removePromptAction(target.id, hideReason);

    setSubmitting(false);

    if (res.success) {
      setShowHideModal(false);
      setHideReason('');
      setTargetPromptForHide(null);
      loadPrompts(searchQuery);
    } else {
      alert(res.error || 'Failed to update prompt moderation status.');
    }
  };

  const handleToggleFeature = async (promptId: string) => {
    setSubmitting(true);
    const res = await togglePromptFeature(promptId);
    setSubmitting(false);
    if (res.success) {
      loadPrompts(searchQuery);
    } else {
      alert(res.error || 'Failed to toggle feature status.');
    }
  };

  const handleSaveBoost = async () => {
    if (!selectedPrompt) return;
    setSubmitting(true);
    const res = await updatePromptBoost(selectedPrompt.id, boostWeight);
    setSubmitting(false);
    if (res.success) {
      setShowBoostModal(false);
      loadPrompts(searchQuery);
    } else {
      alert(res.error || 'Failed to update prompt boost weight.');
    }
  };

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

  // Table Columns Setup
  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Prompt Template',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-zinc-900 truncate max-w-xs">{p.title}</div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="font-semibold text-indigo-600">@{p.creatorUsername}</span>
              <span>•</span>
              <span>{p.aiTool}</span>
              <span>•</span>
              <span>{p.category}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Moderation State',
      render: (p) => (
        <AdminStatusBadge
          status={p.isHidden ? 'pending_deletion' : 'active'}
          label={p.isHidden ? 'Hidden / Removed' : 'Active'}
        />
      )
    },
    {
      key: 'engagement',
      header: 'Engagement',
      render: (p) => (
        <div className="font-mono text-[11px] text-zinc-600">
          <div>{p.likesCount || 0} ★ / {p.copiesCount || 0} copies</div>
          <div className="text-zinc-400">{p.remixCount || 0} remixes</div>
        </div>
      )
    },
    {
      key: 'boostWeight',
      header: 'Boost Weight',
      render: (p) => (
        <span className="font-mono font-bold text-indigo-600">
          {p.boostWeight}x
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (p) => <span className="text-zinc-500 font-medium">{new Date(p.createdAt).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setSelectedPrompt(p);
              setIsInspectionOpen(true);
            }}
            title="Inspect Details"
            className="p-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleFeature(p.id)}
            disabled={submitting}
            title={p.isFeatured ? 'Unfeature Prompt' : 'Feature Prompt'}
            className={`p-1.5 rounded-lg border transition-colors ${
              p.isFeatured 
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' 
                : 'border-zinc-200 hover:border-zinc-300 text-zinc-400 hover:text-amber-500'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (p.isHidden) {
                setTargetPromptForHide(p);
                handleToggleHide();
              } else {
                setTargetPromptForHide(p);
                setHideReason('');
                setShowHideModal(true);
              }
            }}
            disabled={submitting}
            title={p.isHidden ? 'Restore Prompt' : 'Hide / Remove Prompt'}
            className={`p-1.5 rounded-lg border transition-colors ${
              p.isHidden 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                : 'border-zinc-200 hover:border-rose-200 text-zinc-400 hover:text-rose-600'
            }`}
          >
            {p.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <AdminPageHeader
        title="Prompt Template Catalog & Moderation"
        description="Inspect prompt source text, manage feature rankings, boost weight multipliers, and execute removal policies."
        icon={FileText}
        badge={{ text: `${prompts.length} Prompts Cataloged`, variant: 'emerald' }}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Prompts' }]}
      >
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, creator, tool..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-zinc-200/80 text-xs font-medium placeholder-zinc-400 focus:outline-none focus:border-indigo-500 w-64 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            Search
          </button>
        </form>
      </AdminPageHeader>

      {/* Main Data Grid */}
      <AdminDataTable
        columns={columns}
        data={prompts}
        loading={loading}
        keyExtractor={(p) => p.id}
        emptyTitle="No prompts found"
        emptyDescription="Try adjusting your search criteria or clear query filters."
        onRowClick={(p) => {
          setSelectedPrompt(p);
          setIsInspectionOpen(true);
        }}
      />

      {/* Slide-Over Inspection Drawer */}
      <AdminSlideOver
        isOpen={isInspectionOpen}
        onClose={() => setIsInspectionOpen(false)}
        title={selectedPrompt ? selectedPrompt.title : 'Prompt Inspection'}
        description="Full text analysis, image preview, curation sections, and moderation status."
      >
        {selectedPrompt && (
          <div className="space-y-6 text-xs text-zinc-700">
            {/* Image Preview if exists */}
            {selectedPrompt.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-zinc-200/80 bg-zinc-50 aspect-video relative">
                <img src={selectedPrompt.imageUrl} alt={selectedPrompt.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Prompt Meta Badges */}
            <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Creator</span>
                <span className="font-bold text-indigo-600">@{selectedPrompt.creatorUsername}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Tool / Category</span>
                <span className="font-semibold text-zinc-800">{selectedPrompt.aiTool} • {selectedPrompt.category}</span>
              </div>
              <AdminStatusBadge
                status={selectedPrompt.isHidden ? 'pending_deletion' : 'active'}
              />
            </div>

            {/* Prompt Text Box */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider">Prompt Source Text</h4>
              <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {selectedPrompt.promptText}
              </div>
            </div>

            {/* Curation & Boost Controls */}
            <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-3">
              <h4 className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider">Algorithmic Boost Multiplier</h4>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Current Multiplier Weight</span>
                <span className="font-mono font-bold text-indigo-600 text-sm">{selectedPrompt.boostWeight}x</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBoostWeight(selectedPrompt.boostWeight || 1.0);
                  setShowBoostModal(true);
                }}
                className="w-full py-2 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white font-semibold text-zinc-700 transition-colors"
              >
                Adjust Multiplier Weight
              </button>
            </div>

            {/* Explore Section Assignments */}
            <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-3">
              <h4 className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider">Curated Explore Sections</h4>
              {curatedSections.length === 0 ? (
                <p className="text-zinc-400">No curated sections created yet.</p>
              ) : (
                <div className="space-y-2">
                  {curatedSections.map((sec) => {
                    const isAssigned = (selectedPrompt.assignedSections || []).includes(sec.id);
                    return (
                      <div key={sec.id} className="flex items-center justify-between py-1 border-b border-zinc-200/60">
                        <span className="font-semibold text-zinc-800">{sec.title}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSectionAssignment(sec.id, !isAssigned)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            isAssigned 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          {isAssigned ? 'Assigned' : 'Assign'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Quick Action Footer */}
            <div className="space-y-2 pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => {
                  setTargetPromptForHide(selectedPrompt);
                  if (selectedPrompt.isHidden) {
                    handleToggleHide();
                  } else {
                    setHideReason('');
                    setShowHideModal(true);
                  }
                }}
                disabled={submitting}
                className={`w-full py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  selectedPrompt.isHidden 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {selectedPrompt.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {selectedPrompt.isHidden ? 'Restore Prompt Template' : 'Hide / Remove Template'}
              </button>

              <Link
                href={`/prompt/${selectedPrompt.id}`}
                target="_blank"
                className="w-full py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Template Page
              </Link>
            </div>
          </div>
        )}
      </AdminSlideOver>

      {/* Confirm Dialog for Prompt Removal */}
      <AdminConfirmDialog
        isOpen={showHideModal}
        onClose={() => setShowHideModal(false)}
        onConfirm={handleToggleHide}
        title="Hide / Remove Prompt Template"
        description={`Specify a policy removal reason for prompt "${targetPromptForHide?.title}".`}
        confirmText="Execute Removal"
        variant="danger"
        isSubmitting={submitting}
      >
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">Policy Violation Reason</label>
          <textarea
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder="Enter reason for prompt removal..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none"
          />
        </div>
      </AdminConfirmDialog>

      {/* Confirm Dialog for Boost Multiplier */}
      <AdminConfirmDialog
        isOpen={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        onConfirm={handleSaveBoost}
        title="Adjust Algorithmic Boost Multiplier"
        description={`Set multiplier weight for prompt "${selectedPrompt?.title}".`}
        confirmText="Save Multiplier"
        variant="info"
        isSubmitting={submitting}
      >
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">Multiplier Weight (1.0x - 5.0x)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10.0"
            value={boostWeight}
            onChange={(e) => setBoostWeight(parseFloat(e.target.value) || 1.0)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none"
          />
        </div>
      </AdminConfirmDialog>

    </div>
  );
}
