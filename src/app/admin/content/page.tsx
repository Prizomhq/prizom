'use client';

import { useState, useEffect, Suspense, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Settings, 
  Home, 
  User, 
  Link as LinkIcon, 
  Users, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  Plus, 
  X, 
  ShieldAlert,
  Sparkles,
  Activity,
  Tags,
  Check,
  Edit2,
  Trash,
  Info,
  Megaphone,
  BookOpen,
  Layers,
  Zap
} from 'lucide-react';
import { 
  getCMSContent, 
  updateHomepageCMS, 
  updateDeveloperCMS, 
  updateFooterCMS,
  getAdminTeamList,
  inviteAdminUser,
  removeAdminUserAction,
  updateAdminUserRole,
  getAuditLogs,
  createCategoryAction,
  editCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  approveCategoryAction,
  createAiToolAction,
  deleteAiToolAction,
  approveAiToolAction,
  getPlatformCategoriesAndTools,
  getExploreSectionsAction,
  createExploreSectionAction,
  editExploreSectionAction,
  deleteExploreSectionAction,
  reorderExploreSectionsAction,
  renameCategoryAction,
  renameAiToolAction,
  toggleAiToolVisibilityAction,
  getAspectRatiosAction,
  updateAspectRatiosAction,
  mergeCategoriesAction,
  mergeAiToolsAction,
  reorderAiToolsAction,
  updateSectionPromptsAction,
  getAdminPromptsList,
  getAboutCMS,
  updateAboutCMS,
  assignPromptCategoryAction
} from '@/app/actions/adminActions';

function AdminContentPageInner() {
  const [activeTab, setActiveTab] = useState<'homepage' | 'developer' | 'footer' | 'team' | 'logs' | 'categories' | 'explore' | 'about'>('homepage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // About Prizom state
  const [aboutForm, setAboutForm] = useState<any>({});

  // Category cover image & prompt assignment states
  const [newCatCoverImage, setNewCatCoverImage] = useState('');
  const [editCatCoverImage, setEditCatCoverImage] = useState('');
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [searchAssignQuery, setSearchAssignQuery] = useState('');
  const [searchingAssign, setSearchingAssign] = useState(false);
  const [assignSearchResults, setAssignSearchResults] = useState<any[]>([]);
  const [loadingCategoryPrompts, setLoadingCategoryPrompts] = useState(false);

  // CMS forms state
  const [homepageForm, setHomepageForm] = useState<any>({});
  const [developerForm, setDeveloperForm] = useState<any>({});
  const [footerForm, setFooterForm] = useState<any>({});

  // Team state
  const [team, setTeam] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'moderator'>('admin');
  const [serviceKeyConfigured, setServiceKeyConfigured] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingMemberEmail, setEditingMemberEmail] = useState('');
  const [editingMemberRole, setEditingMemberRole] = useState<'super_admin' | 'admin' | 'moderator'>('admin');

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);

  // Categories and AI Tools state
  const [categories, setCategories] = useState<any[]>([]);
  const [aiTools, setAiTools] = useState<any[]>([]);

  // Inline creation states for Category
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatFeatured, setNewCatFeatured] = useState(false);
  const [newCatExplore, setNewCatExplore] = useState(true);

  // Inline creation states for AI Tool
  const [newToolName, setNewToolName] = useState('');

  // Editing Category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatFeatured, setEditCatFeatured] = useState(false);
  const [editCatExplore, setEditCatExplore] = useState(true);

  // Explore Sections state
  const [sections, setSections] = useState<any[]>([]);
  const [newSecTitle, setNewSecTitle] = useState('');
  const [newSecType, setNewSecType] = useState<'curated' | 'dynamic'>('curated');
  const [newSecAlgo, setNewSecAlgo] = useState<'trending' | 'most_remixed' | 'new_creators' | 'recent'>('trending');

  // Editing Section state
  const [editingSecId, setEditingSecId] = useState<string | null>(null);
  const [editSecTitle, setEditSecTitle] = useState('');
  const [editSecHidden, setEditSecHidden] = useState(false);
  const [editSecFeatured, setEditSecFeatured] = useState(false);

  // Aspect Ratios configuration states
  const [aspectRatios, setAspectRatios] = useState<any[]>([]);
  const [newRatioId, setNewRatioId] = useState('');
  const [newRatioLabel, setNewRatioLabel] = useState('');
  const [newRatioIcon, setNewRatioIcon] = useState('□');

  // Curation Operations States
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);
  const [renameCatName, setRenameCatName] = useState('');
  const [mergingCatSourceId, setMergingCatSourceId] = useState<string | null>(null);
  const [mergingCatTargetId, setMergingCatTargetId] = useState('');

  const [renamingToolId, setRenamingToolId] = useState<string | null>(null);
  const [renameToolName, setRenameToolName] = useState('');
  const [mergingToolSourceId, setMergingToolSourceId] = useState<string | null>(null);
  const [mergingToolTargetId, setMergingToolTargetId] = useState('');

  // Prompt Curation & Search States
  const [allPrompts, setAllPrompts] = useState<any[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [expandedSecId, setExpandedSecId] = useState<string | null>(null);
  const [searchPromptQuery, setSearchPromptQuery] = useState('');
  const [searchingPrompts, setSearchingPrompts] = useState(false);
  const [promptSearchResults, setPromptSearchResults] = useState<any[]>([]);

  // Category and AI Tools reordering handlers
  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const approvedCats = categories.filter(c => c.approved !== false);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= approvedCats.length) return;

    const newCats = [...approvedCats];
    // Swap order
    const temp = newCats[index].order;
    newCats[index].order = newCats[targetIndex].order;
    newCats[targetIndex].order = temp;

    const reorderPayload = newCats.map(c => ({ id: c.id, order: c.order }));
    const res = await reorderCategoriesAction(reorderPayload);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to reorder categories.');
    }
  };

  const handleMoveTool = async (index: number, direction: 'up' | 'down') => {
    const approvedTools = aiTools.filter(t => t.approved !== false);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= approvedTools.length) return;

    const newTools = [...approvedTools];
    // Swap order
    const temp = newTools[index].order ?? (index + 1);
    newTools[index].order = newTools[targetIndex].order ?? (targetIndex + 1);
    newTools[targetIndex].order = temp;

    const reorderPayload = newTools.map(t => ({ id: t.id, order: t.order ?? 0 }));
    const res = await reorderAiToolsAction(reorderPayload);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to reorder AI Tools.');
    }
  };

  // Section prompt curation handlers
  const handleSearchPrompts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPromptQuery.trim()) {
      setPromptSearchResults([]);
      return;
    }
    setSearchingPrompts(true);
    const res = await getAdminPromptsList(searchPromptQuery);
    if (res.success && res.prompts) {
      setPromptSearchResults(res.prompts);
    } else {
      alert(res.error || 'Failed to search prompts.');
    }
    setSearchingPrompts(false);
  };

  const handleAddPromptToSection = async (secId: string, promptId: string) => {
    const section = sections.find(s => s.id === secId);
    if (!section) return;
    const currentIds = section.prompt_ids ? [...section.prompt_ids] : [];
    if (currentIds.includes(promptId)) return;
    const newIds = [...currentIds, promptId];

    const res = await updateSectionPromptsAction(secId, newIds);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to add prompt to section.');
    }
  };

  const handleRemovePromptFromSection = async (secId: string, promptId: string) => {
    const section = sections.find(s => s.id === secId);
    if (!section) return;
    const currentIds = section.prompt_ids ? [...section.prompt_ids] : [];
    const newIds = currentIds.filter(id => id !== promptId);

    const res = await updateSectionPromptsAction(secId, newIds);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to remove prompt.');
    }
  };

  const handlePinPromptInSection = async (secId: string, promptId: string) => {
    const section = sections.find(s => s.id === secId);
    if (!section) return;
    const currentIds = section.prompt_ids ? [...section.prompt_ids] : [];
    const filtered = currentIds.filter(id => id !== promptId);
    const newIds = [promptId, ...filtered];

    const res = await updateSectionPromptsAction(secId, newIds);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to pin prompt.');
    }
  };

  const handleMovePromptInSection = async (secId: string, index: number, direction: 'up' | 'down') => {
    const section = sections.find(s => s.id === secId);
    if (!section) return;
    const currentIds = section.prompt_ids ? [...section.prompt_ids] : [];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentIds.length) return;

    // Swap elements
    const temp = currentIds[index];
    currentIds[index] = currentIds[targetIndex];
    currentIds[targetIndex] = temp;

    const res = await updateSectionPromptsAction(secId, currentIds);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to reorder prompt.');
    }
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getCMSContent(),
      getAdminTeamList().catch(() => ({ success: false, team: [], serviceKeyConfigured: false })),
      getAuditLogs().catch(() => ({ success: false, logs: [] })),
      getPlatformCategoriesAndTools().catch(() => ({ success: false, categories: [], ai_tools: [] })),
      getExploreSectionsAction().catch(() => ({ success: false, sections: [] })),
      getAboutCMS().catch(() => ({ success: false, about: {} }))
    ]).then(([cmsRes, teamRes, logsRes, catRes, exploreRes, aboutRes]) => {
      if (cmsRes.success) {
        setHomepageForm(cmsRes.homepage || {});
        setDeveloperForm(cmsRes.developer || {});
        setFooterForm(cmsRes.footer || {});
      }
      if (aboutRes.success) {
        setAboutForm(aboutRes.about || {});
      }
      if (teamRes.success && teamRes.team) {
        setTeam(teamRes.team);
        setServiceKeyConfigured(teamRes.serviceKeyConfigured !== false);
      }
      if (logsRes.success && logsRes.logs) {
        setLogs(logsRes.logs);
      }
      if (catRes.success) {
        setCategories(catRes.categories || []);
        setAiTools(catRes.ai_tools || []);
        setAspectRatios((catRes as any).aspect_ratios || []);
      }
      if (exploreRes.success && exploreRes.sections) {
        setSections(exploreRes.sections);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (tab && ['homepage', 'developer', 'footer', 'team', 'logs', 'categories', 'explore', 'about'].includes(tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tab as any);
    }
  }, [tab]);

  useEffect(() => {
    if (activeTab === 'explore' || activeTab === 'categories') {
      const fetchPrompts = async () => {
        setLoadingPrompts(true);
        const res = await getAdminPromptsList('');
        if (res.success && res.prompts) {
          setAllPrompts(res.prompts);
        }
        setLoadingPrompts(false);
      };
      fetchPrompts();
    }
  }, [activeTab]);

  const handleSearchAssignPrompts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAssignQuery.trim()) {
      setAssignSearchResults([]);
      return;
    }
    setSearchingAssign(true);
    const res = await getAdminPromptsList(searchAssignQuery);
    if (res.success && res.prompts) {
      setAssignSearchResults(res.prompts);
    } else {
      alert(res.error || 'Failed to search prompts.');
    }
    setSearchingAssign(false);
  };

  const handleAssignPromptCategory = async (promptId: string, categoryName: string) => {
    setLoadingCategoryPrompts(true);
    const res = await assignPromptCategoryAction(promptId, categoryName);
    if (res.success) {
      const promptsRes = await getAdminPromptsList('');
      if (promptsRes.success && promptsRes.prompts) {
        setAllPrompts(promptsRes.prompts);
      }
      if (searchAssignQuery.trim()) {
        const searchRes = await getAdminPromptsList(searchAssignQuery);
        if (searchRes.success && searchRes.prompts) {
          setAssignSearchResults(searchRes.prompts);
        }
      }
    } else {
      alert(res.error || 'Failed to update prompt category.');
    }
    setLoadingCategoryPrompts(false);
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const res = await updateAboutCMS(aboutForm);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(res.error || 'Failed to save About Prizom settings.');
    }
    setSaving(false);
  };

  // Explore Section Actions
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecTitle.trim()) return;
    setSaving(true);
    const res = await createExploreSectionAction(newSecTitle, newSecType, newSecType === 'dynamic' ? newSecAlgo : undefined);
    if (res.success) {
      setNewSecTitle('');
      setNewSecType('curated');
      loadData();
      alert('Explore Section created successfully.');
    } else {
      alert(res.error || 'Failed to create section.');
    }
    setSaving(false);
  };

  const handleSaveEditSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSecId || !editSecTitle.trim()) return;
    setSaving(true);
    const res = await editExploreSectionAction(editingSecId, editSecTitle, editSecHidden, editSecFeatured);
    if (res.success) {
      setEditingSecId(null);
      loadData();
      alert('Explore Section updated successfully.');
    } else {
      alert(res.error || 'Failed to update section.');
    }
    setSaving(false);
  };

  const startEditSection = (sec: any) => {
    setEditingSecId(sec.id);
    setEditSecTitle(sec.title);
    setEditSecHidden(sec.is_hidden || false);
    setEditSecFeatured(sec.is_featured || false);
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Explore Section?')) return;
    const res = await deleteExploreSectionAction(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to delete section.');
    }
  };

  const handleToggleSectionHidden = async (sec: any) => {
    const res = await editExploreSectionAction(sec.id, sec.title, !sec.is_hidden, sec.is_featured ?? false);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to toggle hidden status.');
    }
  };

  const handleToggleSectionFeatured = async (sec: any) => {
    const res = await editExploreSectionAction(sec.id, sec.title, sec.is_hidden ?? false, !sec.is_featured);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to toggle featured status.');
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Swap order
    const temp = newSections[index].order;
    newSections[index].order = newSections[targetIndex].order;
    newSections[targetIndex].order = temp;

    // Call reorder API
    const reorderPayload = newSections.map(s => ({ id: s.id, order: s.order }));
    const res = await reorderExploreSectionsAction(reorderPayload);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to reorder sections.');
    }
  };

  // Category Actions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    const res = await createCategoryAction(newCatName, newCatDesc, newCatFeatured, newCatExplore, newCatCoverImage);
    if (res.success) {
      setNewCatName('');
      setNewCatDesc('');
      setNewCatCoverImage('');
      setNewCatFeatured(false);
      setNewCatExplore(true);
      loadData();
      alert('Category created successfully.');
    } else {
      alert(res.error || 'Failed to create category.');
    }
    setSaving(false);
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatId || !editCatName.trim()) return;
    setSaving(true);
    const res = await editCategoryAction(editingCatId, editCatName, editCatDesc, editCatFeatured, editCatExplore, undefined, editCatCoverImage);
    if (res.success) {
      setEditingCatId(null);
      setEditCatCoverImage('');
      loadData();
      alert('Category updated successfully.');
    } else {
      alert(res.error || 'Failed to update category.');
    }
    setSaving(false);
  };

  const startEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setEditCatCoverImage(cat.cover_image || '');
    setEditCatFeatured(cat.is_featured || false);
    setEditCatExplore(cat.show_on_explore ?? true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All prompts mapped to it will lose category alignment.')) return;
    const res = await deleteCategoryAction(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to delete category.');
    }
  };

  const handleApproveCategory = async (id: string) => {
    const res = await approveCategoryAction(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to approve category.');
    }
  };

  const handleToggleFeatured = async (cat: any) => {
    const res = await editCategoryAction(cat.id, cat.name, cat.description || '', !cat.is_featured, cat.show_on_explore ?? true);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to toggle featured status.');
    }
  };

  const handleToggleExplore = async (cat: any) => {
    const res = await editCategoryAction(cat.id, cat.name, cat.description || '', cat.is_featured ?? false, !cat.show_on_explore);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to toggle explore status.');
    }
  };

  // AI Tool Actions
  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim()) return;
    setSaving(true);
    const res = await createAiToolAction(newToolName);
    if (res.success) {
      setNewToolName('');
      loadData();
      alert('AI Tool created successfully.');
    } else {
      alert(res.error || 'Failed to create AI Tool.');
    }
    setSaving(false);
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI Tool?')) return;
    const res = await deleteAiToolAction(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to delete AI Tool.');
    }
  };

  const handleApproveTool = async (id: string) => {
    const res = await approveAiToolAction(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to approve AI Tool.');
    }
  };

  // Category Curation Handlers
  const handleRenameCategory = async (id: string, newName: string) => {
    setSaving(true);
    const res = await renameCategoryAction(id, newName);
    if (res.success) {
      setRenamingCatId(null);
      setRenameCatName('');
      loadData();
      alert('Category renamed successfully.');
    } else {
      alert(res.error || 'Failed to rename category.');
    }
    setSaving(false);
  };

  const handleMergeCategories = async (sourceId: string, targetId: string) => {
    if (!confirm('Are you sure you want to merge these categories? All prompts using the source category will be updated to use the target category, and the source category will be permanently deleted.')) return;
    setSaving(true);
    const res = await mergeCategoriesAction(sourceId, targetId);
    if (res.success) {
      setMergingCatSourceId(null);
      setMergingCatTargetId('');
      loadData();
      alert('Categories merged successfully.');
    } else {
      alert(res.error || 'Failed to merge categories.');
    }
    setSaving(false);
  };

  // AI Tool Curation Handlers
  const handleRenameTool = async (id: string, newName: string) => {
    setSaving(true);
    const res = await renameAiToolAction(id, newName);
    if (res.success) {
      setRenamingToolId(null);
      setRenameToolName('');
      loadData();
      alert('AI Tool renamed successfully.');
    } else {
      alert(res.error || 'Failed to rename AI Tool.');
    }
    setSaving(false);
  };

  const handleMergeTools = async (sourceId: string, targetId: string) => {
    if (!confirm('Are you sure you want to merge these AI Tools? All prompts using the source tool will be updated to use the target tool, and the source tool will be permanently deleted.')) return;
    setSaving(true);
    const res = await mergeAiToolsAction(sourceId, targetId);
    if (res.success) {
      setMergingToolSourceId(null);
      setMergingToolTargetId('');
      loadData();
      alert('AI Tools merged successfully.');
    } else {
      alert(res.error || 'Failed to merge AI Tools.');
    }
    setSaving(false);
  };

  const handleToggleToolExplore = async (id: string) => {
    const res = await toggleAiToolVisibilityAction(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to toggle AI Tool visibility.');
    }
  };

  // Aspect Ratio Settings Handlers
  const handleAddAspectRatio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRatioId.trim() || !newRatioLabel.trim()) return;
    
    const duplicate = aspectRatios.some(r => r.id === newRatioId.trim());
    if (duplicate) {
      alert('Aspect Ratio option already exists.');
      return;
    }

    const order = aspectRatios.length + 1;
    const newRatios = [
      ...aspectRatios,
      {
        id: newRatioId.trim(),
        label: newRatioLabel.trim(),
        icon: newRatioIcon,
        order
      }
    ];

    setSaving(true);
    const res = await updateAspectRatiosAction(newRatios);
    if (res.success) {
      setNewRatioId('');
      setNewRatioLabel('');
      setNewRatioIcon('□');
      loadData();
      alert('Aspect Ratio added successfully.');
    } else {
      alert(res.error || 'Failed to add Aspect Ratio.');
    }
    setSaving(false);
  };

  const handleDeleteAspectRatio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this aspect ratio option? This will not affect existing prompts in the database but removes it as an option for future uploads.')) return;
    
    const newRatios = aspectRatios.filter(r => r.id !== id);
    setSaving(true);
    const res = await updateAspectRatiosAction(newRatios);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to delete Aspect Ratio.');
    }
    setSaving(false);
  };

  const addPromoBlock = () => {
    const blocks = [...(homepageForm.promo_blocks || [])];
    const newBlock = {
      id: 'promo-' + Math.random().toString(36).substring(2, 9),
      title: 'New Promo Announcement',
      content: 'Highlight a feature, event, or group to creators.',
      link_text: 'Click Here',
      link_url: '#',
      style: 'banner' as const,
      order: blocks.length + 1,
      is_active: true
    };
    setHomepageForm({ ...homepageForm, promo_blocks: [...blocks, newBlock] });
  };

  const deletePromoBlock = (id: string) => {
    const blocks = (homepageForm.promo_blocks || []).filter((b: any) => b.id !== id);
    setHomepageForm({ ...homepageForm, promo_blocks: blocks });
  };

  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const res = await updateHomepageCMS(homepageForm);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert('Failed to save homepage settings.');
    }
    setSaving(false);
  };

  const handleSaveDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const res = await updateDeveloperCMS(developerForm);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(res.error || 'Failed to save developer section settings.');
    }
    setSaving(false);
  };

  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const res = await updateFooterCMS(footerForm);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(res.error || 'Failed to save footer settings. Only Super Admins hold clearance.');
    }
    setSaving(false);
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    const res = await inviteAdminUser(newAdminEmail, newAdminRole);
    if (res.success) {
      setNewAdminEmail('');
      loadData();
      alert('Administrator whitelisted successfully.');
    } else {
      alert(res.error || 'Failed to invite administrator.');
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from Prizom Administrators?`)) return;
    const res = await removeAdminUserAction(email);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to remove administrator.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest">Loading Settings Panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-500" />
            Platform settings & CMS
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Configure Hero announcements, Meet Developer bios, Footer links, and Admin Team access</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider animate-bounce">
            <CheckCircle2 className="w-4.5 h-4.5" />
            Changes locked & synchronized
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-px">
        <button
          onClick={() => setActiveTab('homepage')}
          className={`px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'homepage' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          Homepage CMS
        </button>
        <button
          onClick={() => setActiveTab('developer')}
          className={`px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'developer' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <User className="w-4.5 h-4.5" />
          Meet Developer
        </button>
        <button
          onClick={() => setActiveTab('footer')}
          className={`px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'footer' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LinkIcon className="w-4.5 h-4.5" />
          Footer Settings
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'team' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          Admin Team
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'logs' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'categories' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Tags className="w-4.5 h-4.5" />
          Categories & Tools
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'explore' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          Explore Manager
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'about' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Info className="w-4.5 h-4.5" />
          About Prizom CMS
        </button>
      </div>

      {/* Forms Area */}
      <div className="bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl max-w-4xl">
        
        {/* HOMEPAGE FORM */}
        {activeTab === 'homepage' && (
          <form onSubmit={handleSaveHomepage} className="space-y-10">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                Homepage Hero Section
              </h3>
              <p className="text-zinc-550 text-[10px] font-bold uppercase tracking-widest mt-1">Configure layout, titles, calls-to-action, and primary/secondary images</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/10 border border-zinc-800/60 p-6 rounded-[2rem]">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Hero Headline</label>
                <input
                  type="text"
                  value={homepageForm.hero_title || ''}
                  onChange={(e) => setHomepageForm({ ...homepageForm, hero_title: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Hero Subtitle</label>
                <textarea
                  value={homepageForm.hero_subtitle || ''}
                  onChange={(e) => setHomepageForm({ ...homepageForm, hero_subtitle: e.target.value })}
                  rows={3}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">CTA Button Text</label>
                <input
                  type="text"
                  value={homepageForm.hero_cta_text || ''}
                  onChange={(e) => setHomepageForm({ ...homepageForm, hero_cta_text: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">CTA Button Redirect Link</label>
                <input
                  type="text"
                  value={homepageForm.hero_cta_link || ''}
                  onChange={(e) => setHomepageForm({ ...homepageForm, hero_cta_link: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Hero Layout Style</label>
                <select
                  value={homepageForm.hero_layout || 'centered'}
                  onChange={(e) => setHomepageForm({ ...homepageForm, hero_layout: e.target.value as any })}
                  className="block w-full px-4 py-3 border border-zinc-800 rounded-2xl bg-zinc-950 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="centered">Centered (Floating glass overlay graphic)</option>
                  <option value="split">Split (Left content / Right card layout)</option>
                </select>
              </div>

              <div className="hidden md:block" />

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Hero Image 1 (Primary / Centered BG)</label>
                <input
                  type="text"
                  value={homepageForm.hero_bg_images?.[0] || ''}
                  onChange={(e) => {
                    const bg = [...(homepageForm.hero_bg_images || [])];
                    bg[0] = e.target.value;
                    setHomepageForm({ ...homepageForm, hero_bg_images: bg });
                  }}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Hero Image 2 (Secondary / Split Right BG)</label>
                <input
                  type="text"
                  value={homepageForm.hero_bg_images?.[1] || ''}
                  onChange={(e) => {
                    const bg = [...(homepageForm.hero_bg_images || [])];
                    bg[1] = e.target.value;
                    setHomepageForm({ ...homepageForm, hero_bg_images: bg });
                  }}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
            </div>

            <div className="border-t border-zinc-800/85 pt-8">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Megaphone className="w-4.5 h-4.5 text-purple-400" />
                Hero Announcement & Top Global Banner
              </h3>
              <p className="text-zinc-555 text-[10px] font-bold uppercase tracking-widest mt-1">Manage global notice bars and hero-level promo badges</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/10 border border-zinc-800/60 p-6 rounded-[2rem]">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Hero Announcement Text</label>
                <input
                  type="text"
                  value={homepageForm.announcement || ''}
                  onChange={(e) => setHomepageForm({ ...homepageForm, announcement: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Announcement CTA Button Text</label>
                <input
                  type="text"
                  value={homepageForm.announcement_cta_text || ''}
                  onChange={(e) => setHomepageForm({ ...homepageForm, announcement_cta_text: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Announcement Link (Redirect URL)</label>
                <input
                  type="text"
                  value={homepageForm.banner_link || ''}
                  onChange={(e) => setHomepageForm({ ...homepageForm, banner_link: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div className="flex items-center pt-8">
                <label className="group flex items-center space-x-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homepageForm.show_announcement || false}
                    onChange={(e) => setHomepageForm({ ...homepageForm, show_announcement: e.target.checked })}
                    className="w-5 h-5 rounded-md border border-zinc-850 bg-zinc-950/30 focus:ring-indigo-550 text-indigo-600 focus:ring-offset-zinc-950"
                  />
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider select-none">Show Hero Announcement Badge</span>
                </label>
              </div>

              <div className="md:col-span-2 border-t border-zinc-800/60 my-2 pt-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Global Top Alert Banner</span>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Banner Alert Text</label>
                <input
                  type="text"
                  value={homepageForm.banner_text || ''}
                  onChange={(e) => setHomepageForm({ ...homepageForm, banner_text: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div className="flex items-center pt-8">
                <label className="group flex items-center space-x-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homepageForm.show_banner || false}
                    onChange={(e) => setHomepageForm({ ...homepageForm, show_banner: e.target.checked })}
                    className="w-5 h-5 rounded-md border border-zinc-850 bg-zinc-950/30 focus:ring-indigo-500 text-indigo-600 focus:ring-offset-zinc-950"
                  />
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider select-none">Publish Banner Alert Globally</span>
                </label>
              </div>
            </div>



            <div className="border-t border-zinc-800/85 pt-8">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-emerald-400" />
                Active Promotional Blocks
              </h3>
              <p className="text-zinc-555 text-[10px] font-bold uppercase tracking-widest mt-1">Manage call-to-action blocks and banners dynamically on the homepage</p>
            </div>

            <div className="space-y-6">
              {(homepageForm.promo_blocks || []).map((promo: any, index: number) => (
                <div key={promo.id || index} className="p-6 border border-zinc-800/80 bg-zinc-955/20 rounded-[2rem] space-y-4 relative group">
                  <button
                    type="button"
                    onClick={() => deletePromoBlock(promo.id)}
                    className="absolute top-6 right-6 p-2 rounded-xl border border-zinc-805 hover:border-red-900/30 text-zinc-500 hover:text-red-405 bg-zinc-955 transition-all"
                    title="Delete Promo Block"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Promo Block #{index + 1}</span>
                    <span className="text-[9px] font-mono text-zinc-550 pr-8">ID: {promo.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-555 mb-1.5">Promo Title</label>
                      <input
                        type="text"
                        value={promo.title || ''}
                        onChange={(e) => {
                          const promos = [...(homepageForm.promo_blocks || [])];
                          promos[index] = { ...promos[index], title: e.target.value };
                          setHomepageForm({ ...homepageForm, promo_blocks: promos });
                        }}
                        className="block w-full px-3 py-2 border border-zinc-805 rounded-xl bg-zinc-955/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-555 mb-1.5">Promo Content</label>
                      <textarea
                        value={promo.content || ''}
                        onChange={(e) => {
                          const promos = [...(homepageForm.promo_blocks || [])];
                          promos[index] = { ...promos[index], content: e.target.value };
                          setHomepageForm({ ...homepageForm, promo_blocks: promos });
                        }}
                        rows={2}
                        className="block w-full px-3 py-2 border border-zinc-805 rounded-xl bg-zinc-955/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-555 mb-1.5">Link Button Text</label>
                      <input
                        type="text"
                        value={promo.link_text || ''}
                        onChange={(e) => {
                          const promos = [...(homepageForm.promo_blocks || [])];
                          promos[index] = { ...promos[index], link_text: e.target.value };
                          setHomepageForm({ ...homepageForm, promo_blocks: promos });
                        }}
                        className="block w-full px-3 py-2 border border-zinc-805 rounded-xl bg-zinc-955/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-555 mb-1.5">Link URL</label>
                      <input
                        type="text"
                        value={promo.link_url || ''}
                        onChange={(e) => {
                          const promos = [...(homepageForm.promo_blocks || [])];
                          promos[index] = { ...promos[index], link_url: e.target.value };
                          setHomepageForm({ ...homepageForm, promo_blocks: promos });
                        }}
                        className="block w-full px-3 py-2 border border-zinc-805 rounded-xl bg-zinc-955/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-555 mb-1.5">Promo Style</label>
                      <select
                        value={promo.style || 'banner'}
                        onChange={(e) => {
                          const promos = [...(homepageForm.promo_blocks || [])];
                          promos[index] = { ...promos[index], style: e.target.value as any };
                          setHomepageForm({ ...homepageForm, promo_blocks: promos });
                        }}
                        className="block w-full px-3 py-2 border border-zinc-805 rounded-xl bg-zinc-955 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="banner">Banner Card (Large callout width)</option>
                        <option value="card">Standard Card (Masonry Grid)</option>
                        <option value="feature">Feature (Top Highlight)</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={promo.is_active || false}
                          onChange={(e) => {
                            const promos = [...(homepageForm.promo_blocks || [])];
                            promos[index] = { ...promos[index], is_active: e.target.checked };
                            setHomepageForm({ ...homepageForm, promo_blocks: promos });
                          }}
                          className="w-4.5 h-4.5 rounded border-zinc-805 bg-zinc-900 text-indigo-650 focus:ring-indigo-550 focus:ring-offset-zinc-950"
                        />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Promo Block is Active</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPromoBlock}
                className="w-full py-4 border border-dashed border-zinc-800 hover:border-indigo-500 hover:bg-indigo-950/15 rounded-3xl text-[10px] text-zinc-400 hover:text-indigo-400 font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4.5 h-4.5" />
                Add New Promo Block
              </button>
            </div>

            <div className="border-t border-zinc-800/80 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-4 bg-gradient-to-r from-indigo-650 to-[var(--color-neon-purple)] hover:from-indigo-600 hover:to-purple-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 transition-all disabled:opacity-50"
              >
                {saving ? 'Locking Settings...' : 'Lock Homepage CMS'}
              </button>
            </div>
          </form>
        )}

        {/* MEET DEVELOPER FORM */}
        {activeTab === 'developer' && (
          <form onSubmit={handleSaveDeveloper} className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-indigo-500" />
              Developer Spotlight bio Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex items-center py-2 md:col-span-2">
                <label className="group flex items-center space-x-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={developerForm.show_section || false}
                    onChange={(e) => setDeveloperForm({ ...developerForm, show_section: e.target.checked })}
                    className="w-5 h-5 rounded-md border border-zinc-850 bg-zinc-950/30 focus:ring-indigo-500 text-indigo-600 focus:ring-offset-zinc-950"
                  />
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider select-none">Show Section on Homepage</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Developer Name</label>
                <input
                  type="text"
                  value={developerForm.name || ''}
                  onChange={(e) => setDeveloperForm({ ...developerForm, name: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Profile image URL</label>
                <input
                  type="text"
                  value={developerForm.avatar_url || ''}
                  onChange={(e) => setDeveloperForm({ ...developerForm, avatar_url: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Short bio</label>
                <textarea
                  value={developerForm.bio || ''}
                  onChange={(e) => setDeveloperForm({ ...developerForm, bio: e.target.value })}
                  rows={2}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Custom personal quote or text note</label>
                <input
                  type="text"
                  value={developerForm.custom_text || ''}
                  onChange={(e) => setDeveloperForm({ ...developerForm, custom_text: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Twitter Profile Link</label>
                <input
                  type="text"
                  value={developerForm.twitter || ''}
                  onChange={(e) => setDeveloperForm({ ...developerForm, twitter: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">GitHub Profile Link</label>
                <input
                  type="text"
                  value={developerForm.github || ''}
                  onChange={(e) => setDeveloperForm({ ...developerForm, github: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-indigo-650 to-[var(--color-neon-purple)] hover:from-indigo-600 hover:to-purple-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 transition-all disabled:opacity-50"
            >
              {saving ? 'Locking Settings...' : 'Lock Developer Spotlight'}
            </button>
          </form>
        )}

        {/* FOOTER SETTINGS FORM */}
        {activeTab === 'footer' && (
          <form onSubmit={handleSaveFooter} className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <LinkIcon className="w-4.5 h-4.5 text-indigo-500" />
              Footer Layout & Socials (Super Admin Only)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Footer description text</label>
                <textarea
                  value={footerForm.about_text || ''}
                  onChange={(e) => setFooterForm({ ...footerForm, about_text: e.target.value })}
                  rows={2}
                  className="block w-full px-4 py-3.5 border border-zinc-805 rounded-2xl bg-zinc-955/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Copyright text</label>
                <input
                  type="text"
                  value={footerForm.copyright_text || ''}
                  onChange={(e) => setFooterForm({ ...footerForm, copyright_text: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-805 rounded-2xl bg-zinc-955/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">X / Twitter corporate link</label>
                <input
                  type="text"
                  value={footerForm.twitter_link || ''}
                  onChange={(e) => setFooterForm({ ...footerForm, twitter_link: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-805 rounded-2xl bg-zinc-955/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Instagram corporate link</label>
                <input
                  type="text"
                  value={footerForm.instagram_link || ''}
                  onChange={(e) => setFooterForm({ ...footerForm, instagram_link: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">YouTube channel link</label>
                <input
                  type="text"
                  value={footerForm.youtube_link || ''}
                  onChange={(e) => setFooterForm({ ...footerForm, youtube_link: e.target.value })}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-indigo-650 to-[var(--color-neon-purple)] hover:from-indigo-600 hover:to-purple-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 transition-all disabled:opacity-50"
            >
              {saving ? 'Locking Settings...' : 'Lock Footer configuration'}
            </button>
          </form>
        )}

        {/* ABOUT PRIZOM CMS FORM */}
        {activeTab === 'about' && (
          <form onSubmit={handleSaveAbout} className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-indigo-500" />
              About Prizom CMS Configuration
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Platform Mission Statement</label>
                <textarea
                  value={aboutForm.platform_mission || ''}
                  onChange={(e) => setAboutForm({ ...aboutForm, platform_mission: e.target.value })}
                  rows={2}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">What is Prizom (Intro Description)</label>
                <textarea
                  value={aboutForm.what_is_prizom || ''}
                  onChange={(e) => setAboutForm({ ...aboutForm, what_is_prizom: e.target.value })}
                  rows={4}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Creator Ecosystem Statement</label>
                <textarea
                  value={aboutForm.creator_ecosystem || ''}
                  onChange={(e) => setAboutForm({ ...aboutForm, creator_ecosystem: e.target.value })}
                  rows={3}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-800/80 pt-6">
                <div className="md:col-span-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">Social Communities Links</h4>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Twitter Profile URL</label>
                  <input
                    type="text"
                    value={aboutForm.twitter_link || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, twitter_link: e.target.value })}
                    className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Instagram Profile URL</label>
                  <input
                    type="text"
                    value={aboutForm.instagram_link || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, instagram_link: e.target.value })}
                    className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">YouTube Channel URL</label>
                  <input
                    type="text"
                    value={aboutForm.youtube_link || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, youtube_link: e.target.value })}
                    className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Discord Server URL</label>
                  <input
                    type="text"
                    value={aboutForm.discord_link || ''}
                    onChange={(e) => setAboutForm({ ...aboutForm, discord_link: e.target.value })}
                    className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-indigo-650 to-[var(--color-neon-purple)] hover:from-indigo-600 hover:to-purple-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 transition-all disabled:opacity-50"
            >
              {saving ? 'Locking Settings...' : 'Lock About CMS'}
            </button>
          </form>
        )}

        {/* TEAM USERS CONFIG */}
        {activeTab === 'team' && (
          <div className="space-y-8">
            {!serviceKeyConfigured && (
              <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-900/40 text-amber-400 text-xs font-bold leading-normal flex items-start gap-3 animate-in fade-in duration-300">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500 animate-pulse" />
                <div>
                  <p className="font-black uppercase tracking-wider mb-1">SUPABASE_SERVICE_ROLE_KEY is missing</p>
                  <p className="text-[11px] font-semibold text-zinc-400">
                    The backend admin client is running in fallback user mode. You will not be able to list team member signup states or update database roles. Please copy your <code className="text-amber-500 bg-amber-950/60 px-1 py-0.5 rounded">service_role</code> key from your Supabase Dashboard under Project Settings &rarr; API, add it to your local <code className="text-amber-500 bg-amber-950/60 px-1 py-0.5 rounded">.env.local</code> as <code className="text-amber-500 bg-amber-950/60 px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code>, and restart your Next.js server.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/40 text-[11px] text-zinc-400 font-bold leading-normal">
              <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Invite new trusted moderators and sys admins by whitelist credentials. Whitelisted accounts auto-bootstrap during their next auth process.</span>
            </div>

            {/* Invite form */}
            <form onSubmit={handleInviteAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/20 border border-zinc-800/60 p-6 rounded-[2rem]">
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-2">Team member email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="name@prizom.com"
                  className="block w-full px-4 py-3 border border-zinc-800 rounded-xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-2">Team Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="block w-full px-4 py-3 border border-zinc-800 rounded-xl bg-zinc-950 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="admin">Administrator</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Invite Admin Node
                </button>
              </div>
            </form>

                        {/* Admins Whitelist Table */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Administrators Whitelist</h4>
              <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950/20">
                <table className="w-full text-xs text-left text-zinc-400 font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-[9px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-950/20">
                      <th className="px-6 py-3.5">Member Details</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-center">Database Sync</th>
                      <th className="px-6 py-3.5 text-center">Role</th>
                      <th className="px-6 py-3.5">Telemetry</th>
                      <th className="px-6 py-3.5 text-right">Delete Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {team.map((member, i) => (
                      <tr key={i} className="hover:bg-zinc-850/5 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.email} className="w-8 h-8 rounded-lg object-cover bg-zinc-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400">
                              {(member.username || member.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-zinc-200 font-bold text-xs">{member.fullName || member.username || (member.accountExists ? member.email.split('@')[0] : 'Pending Signup')}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{member.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                            member.status === 'Active' 
                              ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' 
                              : 'text-amber-400 bg-amber-950/20 border-amber-900/30'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                            member.syncedInDb 
                              ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' 
                              : 'text-rose-400 bg-rose-950/20 border-rose-900/30'
                          }`}>
                            {member.syncedInDb ? 'Synced' : 'Out of Sync'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span className={`inline-flex px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-wider ${
                              member.role === 'super_admin' ? 'text-red-400 bg-red-950/20 border-red-900/20' : 
                              member.role === 'admin' ? 'text-indigo-400 bg-indigo-950/20 border-indigo-900/20' : 
                              'text-teal-400 bg-teal-950/20 border-teal-900/20'
                            }`}>
                              {member.role === 'super_admin' ? 'Super Admin' : member.role === 'admin' ? 'Admin' : 'Moderator'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMemberEmail(member.email);
                                setEditingMemberRole(member.role);
                                setShowRoleModal(true);
                              }}
                              className="p-1 text-zinc-550 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
                              title="Edit Role"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[9px] text-zinc-500 space-y-0.5">
                          <p>In: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}</p>
                          <p>Log: {member.lastSignInAt ? new Date(member.lastSignInAt).toLocaleDateString() : 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {member.role !== 'super_admin' ? (
                            <button
                              onClick={() => handleRemoveAdmin(member.email)}
                              className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900/30 text-zinc-500 hover:text-red-400 bg-zinc-900 hover:bg-red-950/20 transition-all"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 select-none pr-2">Sys Lock</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOGS DISPLAY */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Moderation Audit trail</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Live platform operations and security logging</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950/20 max-h-96 overflow-y-auto no-scrollbar">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 font-bold text-xs uppercase">
                  No moderation logs registered yet.
                </div>
              ) : (
                <table className="w-full text-xs text-left text-zinc-400 font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-[9px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-950/20 sticky top-0 z-10">
                      <th className="px-6 py-3.5">Admin Filer</th>
                      <th className="px-6 py-3.5">Action Code</th>
                      <th className="px-6 py-3.5">Target ID</th>
                      <th className="px-6 py-3.5">Reason Notes</th>
                      <th className="px-6 py-3.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-850/5 transition-colors">
                        <td className="px-6 py-3.5 text-indigo-400 font-mono text-[10px]">{log.adminEmail}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-zinc-500 font-mono text-[9px]">...{log.targetId.substring(0, 15)}</td>
                        <td className="px-6 py-3.5 text-zinc-300 truncate max-w-[200px]" title={log.reason}>{log.reason || '-'}</td>
                        <td className="px-6 py-3.5 text-right text-zinc-500 font-mono text-[9px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* CATEGORIES MANAGEMENT WORKSPACE */}
        {activeTab === 'categories' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            
            {/* Header / Info */}
            <div className="flex items-center gap-3 p-5 rounded-3xl bg-zinc-950/40 border border-zinc-800/40 text-xs text-zinc-400 font-bold leading-normal">
              <Tags className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
              <span>
                Moderate custom category and AI tool suggestions requested by users during prompt upload. Configure Explore feed visibility, feature status, and custom tag directories dynamically.
              </span>
            </div>

            {/* Section 1: Pending Suggestions */}
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                Pending Creator Suggestions
              </h3>
              
              {categories.filter(c => !c.approved).length === 0 && aiTools.filter(t => !t.approved).length === 0 ? (
                <div className="p-8 text-center text-zinc-650 border border-dashed border-zinc-800 rounded-2xl font-bold text-xs uppercase bg-zinc-950/10">
                  No pending suggestions to review.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Suggestions */}
                  {categories.filter(c => !c.approved).map((cat) => (
                    <div key={cat.id} className="p-5 rounded-2xl bg-zinc-950/30 border border-zinc-800/60 flex flex-col justify-between gap-4 hover:border-zinc-700 transition-all duration-200">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 border border-indigo-900/30 bg-indigo-950/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                            Category suggestion
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">by {cat.suggestedBy || 'anonymous'}</span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-2">{cat.name}</h4>
                        <p className="text-[11px] text-zinc-400 font-semibold mt-1">{cat.description || 'No description supplied.'}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveCategory(cat.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-650 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* AI Tool Suggestions */}
                  {aiTools.filter(t => !t.approved).map((tool) => (
                    <div key={tool.id} className="p-5 rounded-2xl bg-zinc-950/30 border border-zinc-800/60 flex flex-col justify-between gap-4 hover:border-zinc-700 transition-all duration-200">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 border border-purple-900/30 bg-purple-950/20 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                            AI Tool suggestion
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">by {tool.suggestedBy || 'anonymous'}</span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-2">{tool.name}</h4>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveTool(tool.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-650 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Approved Categories Table & Inline Form */}
            <div className="border-t border-zinc-800/80 pt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Tags className="w-4 h-4 text-indigo-400 shrink-0" />
                  Approved Categories Directory
                </h3>
              </div>

              {/* Inline Edit Form Overlay */}
              {editingCatId && (
                <form onSubmit={handleSaveEditCategory} className="mb-6 p-6 rounded-2xl bg-zinc-950 border border-indigo-900/40 space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Editing Category: {editingCatId}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Category Name</label>
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={editCatDesc}
                        onChange={(e) => setEditCatDesc(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Cover Image URL</label>
                      <input
                        type="text"
                        value={editCatCoverImage}
                        onChange={(e) => setEditCatCoverImage(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>
                    <div className="flex items-center space-x-6 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editCatFeatured}
                          onChange={(e) => setEditCatFeatured(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-900 text-indigo-650 focus:ring-indigo-550 focus:ring-offset-zinc-950"
                        />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Featured Tag</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editCatExplore}
                          onChange={(e) => setEditCatExplore(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-900 text-indigo-650 focus:ring-indigo-550 focus:ring-offset-zinc-950"
                        />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Show on Explore</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingCatId(null); setEditCatCoverImage(''); }}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950/20 mb-6">
                <table className="w-full text-xs text-left text-zinc-400 font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-[9px] font-black uppercase text-zinc-555 tracking-wider bg-zinc-950/20">
                      <th className="px-6 py-3.5">Category Details</th>
                      <th className="px-6 py-3.5 text-center">Featured status</th>
                      <th className="px-6 py-3.5 text-center">Explore Visibility</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {categories.filter(c => c.approved !== false).map((cat, idx) => (
                      <Fragment key={cat.id}>
                        <tr className="hover:bg-zinc-850/5 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            {cat.cover_image ? (
                              <img src={cat.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover bg-zinc-800 border border-zinc-800 animate-in fade-in duration-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-zinc-800/40 border border-zinc-800/80 flex items-center justify-center text-[10px] font-black text-zinc-650">
                                No Img
                              </div>
                            )}
                            <div>
                              <p className="text-zinc-200 font-bold text-xs">{cat.name}</p>
                              <p className="text-[10px] text-zinc-550 font-medium mt-0.5">{cat.description || 'No description set.'}</p>
                              <p className="text-[9px] text-zinc-600 font-mono mt-0.5">Slug ID: {cat.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleFeatured(cat)}
                              className={`inline-flex px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${
                                cat.is_featured 
                                  ? 'text-amber-400 bg-amber-950/20 border-amber-900/30' 
                                  : 'text-zinc-500 bg-zinc-900/30 border-zinc-800'
                              }`}
                            >
                              {cat.is_featured ? '★ Featured' : '☆ Standard'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleExplore(cat)}
                              className={`inline-flex px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${
                                cat.show_on_explore ?? true 
                                  ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' 
                                  : 'text-rose-400 bg-rose-950/20 border-rose-900/30'
                              }`}
                            >
                              {(cat.show_on_explore ?? true) ? 'Visible' : 'Hidden'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5 items-center">
                              <button
                                type="button"
                                onClick={() => handleMoveCategory(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-xs font-bold"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCategory(idx, 'down')}
                                disabled={idx === categories.filter(c => c.approved !== false).length - 1}
                                className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-xs font-bold"
                                title="Move Down"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedCatId(expandedCatId === cat.id ? null : cat.id);
                                  setSearchAssignQuery('');
                                  setAssignSearchResults([]);
                                }}
                                className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                                  expandedCatId === cat.id
                                    ? 'bg-indigo-650 text-white border-indigo-650'
                                    : 'border-zinc-800 hover:border-indigo-900/30 text-zinc-450 hover:text-indigo-400 bg-zinc-900 hover:bg-indigo-950/20'
                                }`}
                                title="Assign prompts to category"
                              >
                                {expandedCatId === cat.id ? 'Close Prompts' : 'Assign Prompts'}
                              </button>
                              <button
                                onClick={() => { setRenamingCatId(cat.id); setRenameCatName(cat.name); }}
                                className="px-2.5 py-1.5 rounded-xl border border-zinc-800 hover:border-indigo-900/30 text-[9px] font-black uppercase tracking-wider text-zinc-450 hover:text-indigo-400 bg-zinc-900 hover:bg-indigo-950/20 transition-all"
                                title="Rename Category"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => { setMergingCatSourceId(cat.id); }}
                                className="px-2.5 py-1.5 rounded-xl border border-zinc-800 hover:border-indigo-900/30 text-[9px] font-black uppercase tracking-wider text-zinc-450 hover:text-indigo-400 bg-zinc-900 hover:bg-indigo-950/20 transition-all"
                                title="Merge Category"
                              >
                                Merge
                              </button>
                              <button
                                onClick={() => startEditCategory(cat)}
                                className="p-2 rounded-xl border border-zinc-800 hover:border-indigo-900/30 text-zinc-555 hover:text-indigo-400 bg-zinc-900 hover:bg-indigo-950/20 transition-all"
                                title="Edit Settings"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 rounded-xl border border-zinc-800 hover:border-red-900/30 text-zinc-555 hover:text-red-400 bg-zinc-900 hover:bg-red-950/20 transition-all"
                                title="Delete Category"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      {expandedCatId === cat.id && (
                        <tr className="bg-zinc-950/40">
                          <td colSpan={4} className="px-6 py-6 border-t border-zinc-800">
                            <div className="space-y-6 text-left">
                              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                Category Prompt Assignment: &quot;{cat.name}&quot;
                              </h4>
                              <form onSubmit={handleSearchAssignPrompts} className="flex gap-2.5 max-w-md">
                                <input
                                  type="text"
                                  placeholder="Search prompts by title..."
                                  value={searchAssignQuery}
                                  onChange={(e) => setSearchAssignQuery(e.target.value)}
                                  className="flex-1 px-3.5 py-2 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                                />
                                <button
                                  type="submit"
                                  disabled={searchingAssign}
                                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                  {searchingAssign ? 'Searching...' : 'Search'}
                                </button>
                              </form>

                              {/* Search Results */}
                              {assignSearchResults.length > 0 && (
                                <div className="border border-zinc-800 rounded-xl bg-zinc-950/40 p-4 space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                                  <p className="text-[9px] text-zinc-550 font-black uppercase tracking-wider mb-2">Search Results:</p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {assignSearchResults.map((prompt) => {
                                      const isAssignedToThis = prompt.category === cat.name;
                                      return (
                                        <div key={prompt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-805">
                                          <div className="flex items-center gap-3.5">
                                            {prompt.imageUrl && (
                                              <img src={prompt.imageUrl} alt="" className="w-9 h-9 rounded object-cover border border-zinc-800" />
                                            )}
                                            <div>
                                              <p className="text-[11px] font-bold text-zinc-200">{prompt.title}</p>
                                              <p className="text-[9px] text-zinc-500">Category: <span className="text-indigo-400">{prompt.category || 'Unassigned'}</span></p>
                                              <p className="text-[9px] text-zinc-605 font-mono">@{prompt.creatorUsername}</p>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleAssignPromptCategory(prompt.id, isAssignedToThis ? '' : cat.name)}
                                            disabled={loadingCategoryPrompts}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                              isAssignedToThis
                                                ? 'bg-rose-955/30 hover:bg-rose-955/50 border border-rose-905/30 text-rose-405'
                                                : 'bg-emerald-650 hover:bg-emerald-600 text-white'
                                            }`}
                                          >
                                            {isAssignedToThis ? 'Remove' : 'Assign'}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Current Prompts in Category */}
                              <div className="space-y-2 mt-4">
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">
                                  Prompts currently in this category:
                                </p>
                                {loadingPrompts ? (
                                  <div className="flex items-center gap-2 text-zinc-500 py-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Loading Prompts...</span>
                                  </div>
                                ) : (allPrompts.filter(p => p.category === cat.name).length === 0) ? (
                                  <p className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider">
                                    No prompts in this category. Use search above to assign some.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 gap-2">
                                    {allPrompts.filter(p => p.category === cat.name).map((prompt, pIdx) => {
                                      return (
                                        <div key={prompt.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-750 transition-all">
                                          <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-mono font-bold text-zinc-600">#{pIdx + 1}</span>
                                            {prompt?.imageUrl && (
                                              <img src={prompt.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-zinc-800" />
                                            )}
                                            <div>
                                              <p className="text-[11px] font-black text-white">{prompt?.title || 'Unknown / Deleted Prompt'}</p>
                                              <p className="text-[9px] text-zinc-500 font-mono">
                                                ID: {prompt.id} {prompt?.creatorUsername ? ` • @${prompt.creatorUsername}` : ''}
                                              </p>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleAssignPromptCategory(prompt.id, '')}
                                            disabled={loadingCategoryPrompts}
                                            className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900/30 text-zinc-500 hover:text-red-400 bg-zinc-900 hover:bg-red-950/20 transition-all ml-2"
                                            title="Remove category assignment"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inline Create Category Form */}
            <form onSubmit={handleCreateCategory} className="bg-zinc-950/30 border border-zinc-800/60 p-6 rounded-2xl space-y-4 mb-10">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Add New Category Tag
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Minimalist UI"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Description</label>
                  <input
                    type="text"
                    placeholder="High fidelity minimalist designer interfaces..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Cover Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newCatCoverImage}
                    onChange={(e) => setNewCatCoverImage(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>
                  <div className="flex items-center space-x-6 sm:col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newCatFeatured}
                        onChange={(e) => setNewCatFeatured(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-900 text-indigo-650 focus:ring-indigo-550 focus:ring-offset-zinc-950"
                      />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Feature Category on Explore</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newCatExplore}
                        onChange={(e) => setNewCatExplore(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-zinc-850 bg-zinc-900 text-indigo-650 focus:ring-indigo-550 focus:ring-offset-zinc-950"
                      />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Publish Immediately</span>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {saving ? 'Creating Category...' : 'Create Category Tag'}
                </button>
              </form>
            </div>

            {/* Section 3: Approved AI Tools directory */}
            <div className="border-t border-zinc-800/80 pt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  AI Model / Tool Directory
                </h3>
              </div>

              {/* Tools Table */}
              <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950/20 mb-6">
                <table className="w-full text-xs text-left text-zinc-400 font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-[9px] font-black uppercase text-zinc-555 tracking-wider bg-zinc-950/20">
                      <th className="px-6 py-3.5">AI Tool Name</th>
                      <th className="px-6 py-3.5 text-center">Explore Visibility</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {aiTools.filter(t => t.approved !== false).map((tool, idx) => (
                      <tr key={tool.id} className="hover:bg-zinc-850/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-zinc-200 font-bold text-xs">{tool.name}</p>
                          <p className="text-[10px] text-zinc-550 font-mono mt-0.5">{tool.id}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleToolExplore(tool.id)}
                            className={`inline-flex px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${
                              tool.show_on_explore ?? true 
                                ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' 
                                : 'text-rose-400 bg-rose-950/20 border-rose-900/30'
                            }`}
                          >
                            {(tool.show_on_explore ?? true) ? 'Visible' : 'Hidden'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5 items-center">
                            <button
                              type="button"
                              onClick={() => handleMoveTool(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-xs font-bold"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveTool(idx, 'down')}
                              disabled={idx === aiTools.filter(t => t.approved !== false).length - 1}
                              className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-xs font-bold"
                              title="Move Down"
                            >
                              ▼
                            </button>
                            <button
                              onClick={() => { setRenamingToolId(tool.id); setRenameToolName(tool.name); }}
                              className="px-2.5 py-1.5 rounded-xl border border-zinc-800 hover:border-indigo-900/30 text-[9px] font-black uppercase tracking-wider text-zinc-450 hover:text-indigo-400 bg-zinc-900 hover:bg-indigo-950/20 transition-all"
                              title="Rename AI Tool"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => { setMergingToolSourceId(tool.id); }}
                              className="px-2.5 py-1.5 rounded-xl border border-zinc-800 hover:border-indigo-900/30 text-[9px] font-black uppercase tracking-wider text-zinc-450 hover:text-indigo-400 bg-zinc-900 hover:bg-indigo-950/20 transition-all"
                              title="Merge AI Tool"
                            >
                              Merge
                            </button>
                            <button
                              onClick={() => handleDeleteTool(tool.id)}
                              className="p-2 rounded-xl border border-zinc-800 hover:border-red-900/30 text-zinc-550 hover:text-red-400 bg-zinc-900 hover:bg-red-950/20 transition-all"
                              title="Delete AI Tool"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Inline Create Tool Form */}
              <form onSubmit={handleCreateTool} className="flex gap-2.5 max-w-md bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl mb-10">
                <input
                  type="text"
                  placeholder="Add AI model (e.g. Midjourney v6.1)"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Add Model
                </button>
              </form>
            </div>

            {/* Section 4: Aspect Ratio Configurations */}
            <div className="border-t border-zinc-800/80 pt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                  Aspect Ratio Configurations
                </h3>
              </div>

              {/* Ratios Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {aspectRatios.map((ratio) => (
                  <div key={ratio.id} className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono text-zinc-300">{ratio.icon}</span>
                        <span className="text-xs font-black text-white">{ratio.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-550 font-mono block mt-1">ID: {ratio.id} (Order: {ratio.order})</span>
                    </div>
                    <button
                      onClick={() => handleDeleteAspectRatio(ratio.id)}
                      className="p-1.5 rounded-lg border border-zinc-850 bg-zinc-900 text-zinc-550 hover:text-red-400 hover:border-red-950/20 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Aspect Ratio Option"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Aspect Ratio Option Form */}
              <form onSubmit={handleAddAspectRatio} className="bg-zinc-950/30 border border-zinc-850 p-6 rounded-2xl space-y-4 max-w-xl">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  Add Aspect Ratio Option
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Ratio ID (e.g. 16:9)</label>
                    <input
                      type="text"
                      placeholder="16:9"
                      value={newRatioId}
                      onChange={(e) => setNewRatioId(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Label (e.g. Landscape)</label>
                    <input
                      type="text"
                      placeholder="16:9 (Landscape)"
                      value={newRatioLabel}
                      onChange={(e) => setNewRatioLabel(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Visual Icon Shape</label>
                    <select
                      value={newRatioIcon}
                      onChange={(e) => setNewRatioIcon(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="□">□ (Square)</option>
                      <option value="▯">▯ (Portrait/Landscape)</option>
                      <option value="▮">▮ (Vertical)</option>
                      <option value="▬">▬ (Ultra Wide)</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Add Aspect Ratio Option
                </button>
              </form>
            </div>

          </div>
        )}

        {/* EXPLORE SECTIONS MANAGER WORKSPACE */}
        {activeTab === 'explore' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            
            {/* Header / Info */}
            <div className="flex items-center gap-3 p-5 rounded-3xl bg-zinc-950/40 border border-zinc-800/40 text-xs text-zinc-400 font-bold leading-normal">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
              <span>
                Redesign Explore page layout. Manage sections, reorder sections (which sets layout order), control section visibility/feature tags, and assign curation algorithms.
              </span>
            </div>

            {/* Approved Sections Directory */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  Explore Page Sections Manager
                </h3>
              </div>

              {/* Inline Edit Form Overlay */}
              {editingSecId && (
                <form onSubmit={handleSaveEditSection} className="mb-6 p-6 rounded-2xl bg-zinc-950 border border-indigo-900/40 space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Editing Section: {editingSecId}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={editSecTitle}
                        onChange={(e) => setEditSecTitle(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-6 pt-6">
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editSecFeatured}
                          onChange={(e) => setEditSecFeatured(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-950"
                        />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Featured Section</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editSecHidden}
                          onChange={(e) => setEditSecHidden(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-950"
                        />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hide Section</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSecId(null)}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950/20 mb-6">
                <table className="w-full text-xs text-left text-zinc-400 font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-[9px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-950/20">
                      <th className="px-6 py-3.5">Order</th>
                      <th className="px-6 py-3.5">Section Title & Details</th>
                      <th className="px-6 py-3.5 text-center">Featured status</th>
                      <th className="px-6 py-3.5 text-center">Visibility</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {sections.map((sec, idx) => (
                      <Fragment key={sec.id}>
                        <tr className="hover:bg-zinc-850/5 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-zinc-500">
                            {sec.order}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-zinc-200 font-bold text-xs">{sec.title}</p>
                            <p className="text-[10px] text-zinc-550 font-bold mt-0.5 uppercase tracking-wider">
                              {sec.type} {sec.algorithm ? `(${sec.algorithm})` : ''} 
                              {sec.type === 'curated' && ` • ${sec.prompt_ids?.length || 0} prompts assigned`}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleSectionFeatured(sec)}
                              className={`inline-flex px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${
                                sec.is_featured 
                                  ? 'text-amber-400 bg-amber-950/20 border-amber-900/30' 
                                  : 'text-zinc-500 bg-zinc-900/30 border-zinc-800'
                              }`}
                            >
                              {sec.is_featured ? '★ Featured' : '☆ Standard'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleSectionHidden(sec)}
                              className={`inline-flex px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${
                                !sec.is_hidden 
                                  ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' 
                                  : 'text-rose-400 bg-rose-950/20 border-rose-900/30'
                              }`}
                            >
                              {!sec.is_hidden ? 'Visible' : 'Hidden'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5 items-center">
                              {sec.type === 'curated' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedSecId(expandedSecId === sec.id ? null : sec.id);
                                    setSearchPromptQuery('');
                                    setPromptSearchResults([]);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                                    expandedSecId === sec.id
                                      ? 'bg-indigo-650 text-white border-indigo-600'
                                      : 'border-zinc-800 hover:border-indigo-900/30 text-zinc-450 hover:text-indigo-400 bg-zinc-900 hover:bg-indigo-950/20'
                                  }`}
                                  title="Manage Prompts inside section"
                                >
                                  {expandedSecId === sec.id ? 'Close Prompts' : 'Manage Prompts'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleMoveSection(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-xs font-bold"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSection(idx, 'down')}
                                disabled={idx === sections.length - 1}
                                className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-xs font-bold"
                                title="Move Down"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditSection(sec)}
                                className="p-2 rounded-xl border border-zinc-800 hover:border-indigo-900/30 text-zinc-550 hover:text-indigo-400 bg-zinc-900 hover:bg-indigo-950/20 transition-all"
                                title="Edit Section Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!['featured', 'trending', 'most-remixed', 'video-ai', 'image-gen', 'chatgpt', 'new-creators', 'recently-uploaded'].includes(sec.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSection(sec.id)}
                                  className="p-2 rounded-xl border border-zinc-800 hover:border-red-900/30 text-zinc-550 hover:text-red-400 bg-zinc-900 hover:bg-red-950/20 transition-all"
                                  title="Delete Section"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {sec.type === 'curated' && expandedSecId === sec.id && (
                          <tr className="bg-zinc-950/40">
                            <td colSpan={5} className="px-6 py-6 border-t border-zinc-800">
                              <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                  Curation Workspace: Add Prompts to &quot;{sec.title}&quot;
                                </h4>
                                <form onSubmit={handleSearchPrompts} className="flex gap-2.5 max-w-md">
                                  <input
                                    type="text"
                                    placeholder="Search prompts by title..."
                                    value={searchPromptQuery}
                                    onChange={(e) => setSearchPromptQuery(e.target.value)}
                                    className="flex-1 px-3.5 py-2 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                                  />
                                  <button
                                    type="submit"
                                    disabled={searchingPrompts}
                                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                  >
                                    {searchingPrompts ? 'Searching...' : 'Search'}
                                  </button>
                                </form>

                                {/* Search Results */}
                                {promptSearchResults.length > 0 && (
                                  <div className="border border-zinc-800 rounded-xl bg-zinc-950/40 p-4 space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider mb-2">Search Results:</p>
                                    <div className="grid grid-cols-1 gap-2">
                                      {promptSearchResults.map((prompt) => {
                                        const isAdded = sec.prompt_ids?.includes(prompt.id);
                                        return (
                                          <div key={prompt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
                                            <div className="flex items-center gap-3.5">
                                              {prompt.imageUrl && (
                                                <img src={prompt.imageUrl} alt="" className="w-9 h-9 rounded object-cover border border-zinc-805" />
                                              )}
                                              <div>
                                                <p className="text-[11px] font-bold text-zinc-200">{prompt.title}</p>
                                                <p className="text-[9px] text-zinc-500 font-mono">@{prompt.creatorUsername}</p>
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleAddPromptToSection(sec.id, prompt.id)}
                                              disabled={isAdded}
                                              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                                isAdded
                                                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-850'
                                                  : 'bg-emerald-650 hover:bg-emerald-600 text-white'
                                              }`}
                                            >
                                              {isAdded ? 'Added' : 'Add to Section'}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Current Curated Prompts in Section */}
                                <div className="space-y-2 mt-4">
                                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">
                                    Curated Section Prompts ({sec.prompt_ids?.length || 0}):
                                  </p>
                                  {loadingPrompts ? (
                                    <div className="flex items-center gap-2 text-zinc-500 py-2">
                                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider">Loading Prompt Metadata...</span>
                                    </div>
                                  ) : (!sec.prompt_ids || sec.prompt_ids.length === 0) ? (
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                                      No prompts curated in this section yet. Use the search bar above to add prompts.
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                      {sec.prompt_ids.map((pId: string, pIdx: number) => {
                                        const prompt = allPrompts.find(p => p.id === pId);
                                        return (
                                          <div key={pId} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-750 transition-all">
                                            <div className="flex items-center gap-3">
                                              <span className="text-[10px] font-mono font-bold text-zinc-600">#{pIdx + 1}</span>
                                              {prompt?.imageUrl && (
                                                <img src={prompt.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-zinc-800" />
                                              )}
                                              <div>
                                                <p className="text-[11px] font-black text-white">{prompt?.title || 'Unknown / Deleted Prompt'}</p>
                                                <p className="text-[9px] text-zinc-500 font-mono">
                                                  ID: {pId} {prompt?.creatorUsername ? ` • @${prompt.creatorUsername}` : ''}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => handlePinPromptInSection(sec.id, pId)}
                                                disabled={pIdx === 0}
                                                className="px-2 py-1 rounded bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 text-amber-400 text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-30"
                                                title="Pin to top"
                                              >
                                                Pin
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleMovePromptInSection(sec.id, pIdx, 'up')}
                                                disabled={pIdx === 0}
                                                className="p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-xs font-bold"
                                                title="Move Up"
                                              >
                                                ▲
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleMovePromptInSection(sec.id, pIdx, 'down')}
                                                disabled={pIdx === sec.prompt_ids.length - 1}
                                                className="p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 text-xs font-bold"
                                                title="Move Down"
                                              >
                                                ▼
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleRemovePromptFromSection(sec.id, pId)}
                                                className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-900/30 text-zinc-550 hover:text-red-400 bg-zinc-900 hover:bg-red-950/20 transition-all ml-2"
                                                title="Remove from Section"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Inline Create Section Form */}
              <form onSubmit={handleCreateSection} className="bg-zinc-950/30 border border-zinc-800/60 p-6 rounded-2xl space-y-4">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  Add Custom Section
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Section Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Cinematic Masterpieces"
                      value={newSecTitle}
                      onChange={(e) => setNewSecTitle(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Section Type</label>
                    <select
                      value={newSecType}
                      onChange={(e) => setNewSecType(e.target.value as any)}
                      className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="curated">Curated (Manual)</option>
                      <option value="dynamic">Dynamic (Algorithmic)</option>
                    </select>
                  </div>
                  {newSecType === 'dynamic' && (
                    <div className="sm:col-span-3">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Select Algorithm</label>
                      <select
                        value={newSecAlgo}
                        onChange={(e) => setNewSecAlgo(e.target.value as any)}
                        className="block w-full px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="trending">Trending Score</option>
                        <option value="most_remixed">Highest Remix Count</option>
                        <option value="new_creators">New Creators to Follow</option>
                        <option value="recent">Recently Uploaded (Newest first)</option>
                      </select>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Section'}
                </button>
              </form>
            </div>

          </div>
        )}

      </div>

      {/* Curation Modals overlays */}
      {/* Category Rename modal */}
      {renamingCatId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 p-6 rounded-[2rem] w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Rename Category</h3>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-2">New Name</label>
              <input
                type="text"
                value={renameCatName}
                onChange={(e) => setRenameCatName(e.target.value)}
                className="block w-full px-4 py-3 border border-zinc-800 rounded-xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                placeholder="New category name"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleRenameCategory(renamingCatId, renameCatName)}
                disabled={saving}
                className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Rename
              </button>
              <button
                onClick={() => { setRenamingCatId(null); setRenameCatName(''); }}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Merge modal */}
      {mergingCatSourceId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 p-6 rounded-[2rem] w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Merge Categories</h3>
            <p className="text-[11px] text-zinc-400 font-bold leading-normal">
              Select the target category to merge <span className="text-indigo-400">&quot;{categories.find(c => c.id === mergingCatSourceId)?.name}&quot;</span> into:
            </p>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-2">Target Category</label>
              <select
                value={mergingCatTargetId}
                onChange={(e) => setMergingCatTargetId(e.target.value)}
                className="block w-full px-4 py-3 border border-zinc-800 rounded-xl bg-zinc-950 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Target Category --</option>
                {categories
                  .filter(c => c.id !== mergingCatSourceId && c.approved !== false)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleMergeCategories(mergingCatSourceId, mergingCatTargetId)}
                disabled={saving || !mergingCatTargetId}
                className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Merge & Delete Old
              </button>
              <button
                onClick={() => { setMergingCatSourceId(null); setMergingCatTargetId(''); }}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool Rename modal */}
      {renamingToolId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 p-6 rounded-[2rem] w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Rename AI Tool</h3>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-2">New Name</label>
              <input
                type="text"
                value={renameToolName}
                onChange={(e) => setRenameToolName(e.target.value)}
                className="block w-full px-4 py-3 border border-zinc-800 rounded-xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                placeholder="New AI tool name"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleRenameTool(renamingToolId, renameToolName)}
                disabled={saving}
                className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Rename
              </button>
              <button
                onClick={() => { setRenamingToolId(null); setRenameToolName(''); }}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool Merge modal */}
      {mergingToolSourceId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 p-6 rounded-[2rem] w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Merge AI Tools</h3>
            <p className="text-[11px] text-zinc-400 font-bold leading-normal">
              Select the target AI Tool to merge <span className="text-indigo-400">&quot;{aiTools.find(t => t.id === mergingToolSourceId)?.name}&quot;</span> into:
            </p>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-555 mb-2">Target AI Tool</label>
              <select
                value={mergingToolTargetId}
                onChange={(e) => setMergingToolTargetId(e.target.value)}
                className="block w-full px-4 py-3 border border-zinc-800 rounded-xl bg-zinc-950 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Target AI Tool --</option>
                {aiTools
                  .filter(t => t.id !== mergingToolSourceId && t.approved !== false)
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleMergeTools(mergingToolSourceId, mergingToolTargetId)}
                disabled={saving || !mergingToolTargetId}
                className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Merge & Delete Old
              </button>
              <button
                onClick={() => { setMergingToolSourceId(null); setMergingToolTargetId(''); }}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminContentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest font-semibold">Loading CMS Panel...</span>
        </div>
      </div>
    }>
      <AdminContentPageInner />
    </Suspense>
  );
}
