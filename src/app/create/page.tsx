'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UploadCloud, Wand2, X, Plus, Image as ImageIcon, Loader2, Lock, ArrowRight, ChevronDown, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { checkBlockStatus } from '@/app/actions/moderation';
import { triggerAchievementCheck } from '@/app/actions/achievements';
import { getPlatformCategoriesAndTools, suggestCategoryOrToolAction } from '@/app/actions/adminActions';
import { createPromptAction, getPopularTags } from '@/app/actions/prompts';

interface ComboboxProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  required?: boolean;
}

function Combobox({ label, value, onChange, options, placeholder, required = false }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [isDirty, setIsDirty] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(value);
    setIsDirty(false);
  }, [value]);

  useEffect(() => {
    if (!isDirty) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredOptions(options);
    } else {
      const results = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredOptions(results);
    }
  }, [search, options, isDirty]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch(value);
        setIsDirty(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-bold text-zinc-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          placeholder={placeholder}
          onFocus={(e) => {
            setIsOpen(true);
            setIsDirty(false);
            e.target.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsDirty(true);
            setIsOpen(true);
          }}
          className="block w-full px-4 py-3 pr-10 border border-zinc-200 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all shadow-sm text-base sm:text-sm font-bold"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-60 overflow-hidden py-0 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-black uppercase tracking-wider sticky top-0 z-10 rounded-t-2xl">
            <span>{label} Options</span>
            <span>{filteredOptions.length} of {options.length}</span>
          </div>

          <div className="py-1 overflow-y-auto flex-1 max-h-48">
            {filteredOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.name);
                  setSearch(opt.name);
                  setIsDirty(false);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-xs font-black transition-all hover:bg-purple-50 hover:text-[var(--color-neon-purple)] flex items-center justify-between ${
                  value === opt.name 
                    ? 'text-[var(--color-neon-purple)] bg-purple-50/60 border-l-4 border-[var(--color-neon-purple)] pl-3' 
                    : 'text-zinc-700 pl-4'
                }`}
              >
                <span>{opt.name}</span>
                {value === opt.name && <Check className="w-3.5 h-3.5 text-[var(--color-neon-purple)]" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-4 py-4 text-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
                No results found
              </div>
            )}
          </div>

          {search.trim() && !options.some(o => o.name.toLowerCase() === search.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={() => {
                onChange(search.trim());
                setIsDirty(false);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-xs font-black text-indigo-650 bg-indigo-50/30 hover:bg-indigo-50 hover:text-indigo-850 border-t border-zinc-100 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create &quot;{search.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const remixId = searchParams.get('remixId');
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('user');

  // Image Upload State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [tool, setTool] = useState('Midjourney v6');
  const [category, setCategory] = useState('Cinematic');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remixNotes, setRemixNotes] = useState('');
  const [parentPrompt, setParentPrompt] = useState<any>(null);

  // Dynamic Metadata state
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableRatios, setAvailableRatios] = useState<any[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  // AI Launcher Advanced States
  const [primaryAiPlatform, setPrimaryAiPlatform] = useState('');
  const [supportedModels, setSupportedModels] = useState<string[]>([]);
  const [modelInput, setModelInput] = useState('');
  const [launchUrl, setLaunchUrl] = useState('');
  const [promptType, setPromptType] = useState('text');
  const [showAdvancedLauncher, setShowAdvancedLauncher] = useState(false);

  // Tag suggestions state
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagSuggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user || (await supabase.auth.getUser()).data.user;
        if (user) {
          setCurrentUser(user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_approved, role')
            .eq('id', user.id)
            .single();
          if (profile) {
            setIsApproved(profile.is_approved || false);
            setUserRole(profile.role || 'user');
          }
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, [supabase.auth]);

  useEffect(() => {
    async function loadMetadata() {
      const res = await getPlatformCategoriesAndTools();
      if (res.success) {
        const approvedTools = (res.ai_tools || []).filter((t: any) => t.approved && t.show_on_explore !== false);
        const approvedCategories = (res.categories || []).filter((c: any) => c.approved && c.show_on_explore !== false);
        const ratios = res.aspect_ratios || [];
        
        setAvailableTools(approvedTools);
        setAvailableCategories(approvedCategories);
        setAvailableRatios(ratios);
        
        if (approvedTools.length > 0) setTool(approvedTools[0].name);
        if (approvedCategories.length > 0) setCategory(approvedCategories[0].name);
        if (ratios.length > 0) setAspectRatio(ratios[0].id);
      }
    }
    loadMetadata();
  }, []);

  useEffect(() => {
    async function loadTags() {
      const res = await getPopularTags();
      if (res.success && res.tags) {
        setPopularTags(res.tags);
      }
    }
    loadTags();
  }, []);

  useEffect(() => {
    if (tagInput.trim() === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredTags([]);
      setShowTagSuggestions(false);
    } else {
      const query = tagInput.trim().toLowerCase();
      const unusedTags = popularTags.filter(t => !tags.includes(t));
      const filtered = unusedTags.filter(t => t.toLowerCase().includes(query));
      setFilteredTags(filtered);
      setShowTagSuggestions(filtered.length > 0);
    }
  }, [tagInput, popularTags, tags]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagSuggestionsRef.current && !tagSuggestionsRef.current.contains(e.target as Node)) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchParentPrompt = async () => {
      if (!remixId) return;
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select('*, profiles!user_id(username, full_name, avatar_url)')
          .eq('id', remixId)
          .single();
        if (data) {
          const block = await checkBlockStatus(data.user_id);
          if (block.anyBlock) {
            setError("You cannot remix a prompt from a creator with a blocked relationship.");
            setParentPrompt(null);
            return;
          }
          setParentPrompt(data);
          setTitle(`Remix of ${data.title}`);
          setPromptText(data.prompt_text);
          setNegativePrompt(data.negative_prompt || '');
          setTool(data.ai_tool);
          setCategory(data.category);
          setTags(data.tags || []);
          setAspectRatio(data.aspect_ratio || '1:1');
        }
      } catch (err) {
        console.error('Error fetching parent prompt for remix:', err);
      }
    };
    fetchParentPrompt();
  }, [remixId, supabase]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError("You must be logged in to create prompts.");
      return;
    }

    const isPrivileged = ['super_admin', 'admin', 'moderator'].includes(userRole);
    if (!isApproved && !isPrivileged) {
      setError("Publishing restricted: Your account is not approved yet.");
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      let imageUrl = null;
      let imageWidth = null;
      let imageHeight = null;

      if (file) {
        setUploadProgress(20);
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('folder', remixId ? 'remixes' : 'prompts');

        setUploadProgress(50);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        const uploadResult = await response.json();

        if (!response.ok) {
          throw new Error(uploadResult.error || 'Image upload failed.');
        }

        imageUrl = uploadResult.url;
        imageWidth = uploadResult.width;
        imageHeight = uploadResult.height;
      }

      setUploadProgress(85);

      let finalTool = tool;
      let finalCategory = category;

      // Auto create custom tools/categories if they don't exist in approval lists
      const toolExists = availableTools.some(t => t.name.toLowerCase() === tool.toLowerCase());
      if (!toolExists && tool.trim()) {
        const suggestRes = await suggestCategoryOrToolAction('tool', tool.trim());
        if (suggestRes.success && suggestRes.tool) {
          finalTool = suggestRes.tool.name;
        } else {
          throw new Error(suggestRes.error || 'Failed to register custom AI Tool.');
        }
      }

      const categoryExists = availableCategories.some(c => c.name.toLowerCase() === category.toLowerCase());
      if (!categoryExists && category.trim()) {
        const suggestRes = await suggestCategoryOrToolAction('category', category.trim());
        if (suggestRes.success && suggestRes.category) {
          finalCategory = suggestRes.category.name;
        } else {
          throw new Error(suggestRes.error || 'Failed to register custom Category.');
        }
      }

      // 2. Call secure Server Action instead of direct client-side insert
      const res = await createPromptAction({
        title,
        prompt_text: promptText,
        negative_prompt: negativePrompt,
        ai_tool: finalTool,
        category: finalCategory,
        tags,
        image_url: imageUrl,
        image_width: imageWidth,
        image_height: imageHeight,
        aspect_ratio: aspectRatio,
        remix_of: remixId || null,
        remix_notes: remixId ? remixNotes : null,
        remix_parent_chain: parentPrompt ? [...(parentPrompt.remix_parent_chain || []), parentPrompt.id] : [],
        primary_ai_platform: primaryAiPlatform.trim() || undefined,
        supported_models: supportedModels,
        launch_url: launchUrl.trim() || undefined,
        prompt_type: promptType
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to save prompt.');
      }

      const data = res.data;

      try {
        await triggerAchievementCheck(currentUser.id, 'upload');
        if (remixId) {
          await triggerAchievementCheck(currentUser.id, 'remix');
        }
      } catch (achError) {
        console.error('Failed to trigger achievements check:', achError);
      }

      setUploadProgress(100);

      if (data && data.length > 0) {
        router.push(`/prompt/${data[0].id}`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during creation.');
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-neon-purple)] mb-4" />
        <p className="text-zinc-500 font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#fcfcfc] px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200 text-center shadow-sm">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-[var(--color-neon-purple)]" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Authentication Required</h2>
          <p className="text-zinc-500 mb-8">You need to be logged in to create and share your AI prompts with the community.</p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center"
          >
            Log In Now <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  const isPrivileged = ['super_admin', 'admin', 'moderator'].includes(userRole);
  const showBlockedState = !isApproved && !isPrivileged;

  if (showBlockedState) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#fcfcfc] px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200 text-center shadow-sm">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Publishing Restricted</h2>
          <p className="text-zinc-500 mb-6 font-medium leading-relaxed">
            Prizom is currently in an invite-only beta. Your account is not approved to publish new prompts yet.
          </p>
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-left text-xs font-semibold text-amber-800 mb-8 leading-relaxed">
            Please contact an administrator for approval, or verify your invite key in Settings.
          </div>
          <button 
            onClick={() => router.push('/settings')}
            className="w-full py-4 rounded-full text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer"
          >
            Go to Settings <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6 md:pb-20 pt-8 bg-[#fcfcfc]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center text-zinc-900 tracking-tight">
            <Wand2 className="w-8 h-8 mr-3 text-[var(--color-neon-purple)]" />
            {parentPrompt ? 'Collaborative Remix Workspace' : 'Create Prompt'}
          </h1>
          <p className="text-zinc-500 mt-2">
            {parentPrompt 
              ? `Remixing and refining "${parentPrompt.title}"` 
              : 'Share your best AI creations with the community.'}
          </p>
        </div>

        {/* Parent Prompt Context Card */}
        {parentPrompt && (
          <div className="mb-8 bg-gradient-to-r from-purple-500/[0.03] to-blue-500/[0.03] border border-zinc-200/60 rounded-3xl p-6 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-neon-purple)]/10 to-[var(--color-electric-blue)]/10 blur-2xl rounded-full pointer-events-none"></div>

            {parentPrompt.image_url && (
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 shadow-sm relative group">
                <img src={parentPrompt.image_url} alt={parentPrompt.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="text-[10px] uppercase font-bold text-white bg-black/60 px-2 py-0.5 rounded-full tracking-wider">Original</span>
                </div>
              </div>
            )}
            
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block text-xs font-bold text-[var(--color-neon-purple)] uppercase tracking-widest mb-1">REMIX CREDIT ATTRIBUTION ASSURED</span>
              <h3 className="text-lg font-black text-zinc-900 leading-tight">Parent: {parentPrompt.title}</h3>
              <p className="text-sm text-zinc-500 font-bold mt-1">
                Created by <span className="text-zinc-900 font-extrabold">@{parentPrompt.profiles?.username || 'unknown'}</span>
              </p>
              <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-white border border-zinc-200/60 rounded-full text-xs font-bold text-zinc-600 shadow-sm">{parentPrompt.ai_tool}</span>
                <span className="px-3 py-1 bg-white border border-zinc-200/60 rounded-full text-xs font-bold text-zinc-600 shadow-sm">{parentPrompt.category}</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white border border-zinc-100 shadow-sm shrink-0">
              <svg className="w-5 h-5 text-zinc-500 rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {!isApproved && !['super_admin', 'admin', 'moderator'].includes(userRole) && (
            <div className="mb-8 p-6 rounded-[2rem] bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex items-start space-x-3 shadow-sm shadow-amber-100 animate-in fade-in slide-in-from-top-2">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-base mb-1 text-amber-900">Publishing Restricted</p>
                <p className="text-amber-800/90 font-medium">
                  Prizom is currently in an invite-only beta. Your account is not approved to publish new prompts yet. If you have an invite key, please sign up with it or contact an administrator for approval.
                </p>
              </div>
            </div>
          )}
          
          {/* Image Upload Area */}
          <div 
            className={`rounded-3xl p-8 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center h-80 relative overflow-hidden group hover:shadow-xs
              ${previewUrl 
                ? 'border-transparent p-0 bg-transparent' 
                : isDragging 
                  ? 'border-[var(--color-neon-purple)] bg-purple-50/40 shadow-inner scale-[0.99]' 
                  : 'border-zinc-300/80 bg-zinc-50/80 hover:bg-zinc-50 hover:border-[var(--color-neon-purple)] cursor-pointer'
              }
            `}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!previewUrl) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (previewUrl) return;
              
              const droppedFile = e.dataTransfer.files?.[0];
              if (droppedFile) {
                const mockEvent = {
                  target: {
                    files: [droppedFile]
                  }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileChange(mockEvent);
              }
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden" 
            />

            {previewUrl ? (
              <div className="w-full h-full relative group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button 
                    type="button" 
                    onClick={removeFile}
                    className="px-6 py-3 bg-white text-red-600 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center shadow-lg"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-zinc-100 group-hover:bg-purple-50 flex items-center justify-center mb-4 transition-colors duration-300">
                  <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-[var(--color-neon-purple)] transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-[var(--color-neon-purple)] transition-colors duration-300">
                  Drag & drop or click to upload cover image
                </h3>
                <p className="text-xs text-zinc-500 font-bold max-w-sm">
                  High-quality PNG, JPG, or WebP up to 5MB. If left blank, a dynamic CSS placeholder will be used.
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all shadow-sm font-bold text-base sm:text-sm"
                  placeholder="e.g. Cinematic Cyberpunk City"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Combobox
                  label="AI Tool"
                  value={tool}
                  onChange={setTool}
                  options={availableTools}
                  placeholder="Search/create AI Tool"
                  required
                />
                <Combobox
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={availableCategories}
                  placeholder="Search/create Category"
                  required
                />
              </div>

              {/* Aspect Ratio Field */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-3">Aspect Ratio <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availableRatios.map((r: any) => {
                    const isSelected = aspectRatio === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setAspectRatio(r.id)}
                        className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between items-center text-center gap-2.5 transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:shadow-sm
                          ${isSelected 
                            ? 'bg-purple-50/50 border-[var(--color-neon-purple)] shadow-sm' 
                            : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                          }
                        `}
                      >
                        <div className="h-8 flex items-center justify-center">
                          <div 
                            className={`rounded border transition-all duration-300
                              ${isSelected 
                                ? 'border-[var(--color-neon-purple)] bg-[var(--color-neon-purple)]/10' 
                                : 'border-zinc-300 bg-zinc-55'
                              }
                            `}
                            style={{
                              width: r.id === '1:1' ? '20px' :
                                     r.id === '16:9' ? '32px' :
                                     r.id === '9:16' ? '15px' :
                                     r.id === '4:5' ? '20px' :
                                     r.id === '3:4' ? '20px' :
                                     r.id === '21:9' ? '36px' :
                                     r.id === '2:3' ? '17px' :
                                     r.id === '3:2' ? '26px' : '20px',
                              height: r.id === '1:1' ? '20px' :
                                      r.id === '16:9' ? '18px' :
                                      r.id === '9:16' ? '27px' :
                                      r.id === '4:5' ? '25px' :
                                      r.id === '3:4' ? '27px' :
                                      r.id === '21:9' ? '15px' :
                                      r.id === '2:3' ? '26px' :
                                      r.id === '3:2' ? '17px' : '20px',
                            }}
                          />
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <span className={`text-[10px] font-black tracking-tight ${isSelected ? 'text-[var(--color-neon-purple)]' : 'text-zinc-900'}`}>
                            {r.icon} {r.id}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-bold mt-0.5">{r.label.split('(')[1]?.replace(')', '') || ''}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-50 text-[var(--color-neon-purple)] text-sm font-medium border border-purple-100">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 focus:outline-none hover:text-purple-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Plus className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    onFocus={(e) => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      const query = tagInput.trim().toLowerCase();
                      const unusedTags = popularTags.filter(t => !tags.includes(t));
                      const filtered = query 
                        ? unusedTags.filter(t => t.toLowerCase().includes(query))
                        : unusedTags.slice(0, 5);
                      setFilteredTags(filtered);
                      setShowTagSuggestions(filtered.length > 0);
                    }}
                    className="block w-full pl-12 pr-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all shadow-sm text-base sm:text-sm"
                    placeholder="Add tags and press Enter"
                  />
                  {showTagSuggestions && (
                    <div ref={tagSuggestionsRef} className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      {filteredTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (!tags.includes(tag)) {
                              setTags([...tags, tag]);
                            }
                            setTagInput('');
                            setShowTagSuggestions(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-black text-zinc-700 hover:bg-purple-50 hover:text-[var(--color-neon-purple)] flex items-center justify-between transition-all cursor-pointer"
                        >
                          <span>{tag}</span>
                          <span className="text-[10px] text-zinc-400 font-bold">Popular tag</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Remix Notes */}
              {remixId && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-sm font-bold text-zinc-700 mb-2">
                    Remix Notes <span className="text-zinc-500 font-normal">(Explain your creative updates)</span>
                  </label>
                  <textarea
                    value={remixNotes}
                    onChange={(e) => setRemixNotes(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    rows={3}
                    required
                    className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all shadow-sm font-medium text-base sm:text-sm"
                    placeholder="e.g. Changed aspect ratio to 16:9, corrected contrast parameters, and optimized cinematic atmosphere."
                  ></textarea>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Prompt <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  rows={8}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-55 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:bg-white focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all font-mono text-base sm:text-sm shadow-inner"
                  placeholder="Enter the exact prompt used to generate this image..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Negative Prompt <span className="text-zinc-500 font-normal">(Optional)</span></label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  rows={4}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-55 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:bg-white focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all font-mono text-base sm:text-sm shadow-inner"
                  placeholder="Enter elements you want the AI to avoid..."
                ></textarea>
              </div>
            </div>
          </div>

      {/* Advanced Launcher Settings (Collapsible) */}
      <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/60 rounded-3xl p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setShowAdvancedLauncher(!showAdvancedLauncher)}
          className="w-full flex items-center justify-between font-black text-sm text-zinc-700 uppercase tracking-wider cursor-pointer"
        >
          <span>Advanced Launcher Settings (Optional)</span>
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showAdvancedLauncher ? 'rotate-180' : ''}`} />
        </button>
        
        {showAdvancedLauncher && (
          <div className="mt-6 pt-6 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Primary AI Platform Override</label>
              <input
                type="text"
                value={primaryAiPlatform}
                onChange={(e) => setPrimaryAiPlatform(e.target.value)}
                className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all text-sm font-bold shadow-sm"
                placeholder="e.g. ChatGPT, Gemini, Claude (leave blank to auto-detect)"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Launcher URL Override</label>
              <input
                type="url"
                value={launchUrl}
                onChange={(e) => setLaunchUrl(e.target.value)}
                className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all text-sm font-bold shadow-sm"
                placeholder="e.g. https://chatgpt.com/g/g-xxxxx (custom GPT link)"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Prompt Type</label>
              <select
                value={promptType}
                onChange={(e) => setPromptType(e.target.value)}
                className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all text-sm font-bold shadow-sm"
              >
                <option value="text">Text Prompt</option>
                <option value="image">Image Generation</option>
                <option value="video">Video Generation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Supported Models</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (modelInput.trim() && !supportedModels.includes(modelInput.trim())) {
                        setSupportedModels([...supportedModels, modelInput.trim()]);
                        setModelInput('');
                      }
                    }
                  }}
                  className="block flex-1 px-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all text-sm font-bold shadow-sm"
                  placeholder="Add model (e.g. gpt-4o) and press Enter"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (modelInput.trim() && !supportedModels.includes(modelInput.trim())) {
                      setSupportedModels([...supportedModels, modelInput.trim()]);
                      setModelInput('');
                    }
                  }}
                  className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-700 transition-all cursor-pointer"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {supportedModels.map(m => (
                  <span key={m} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200">
                    {m}
                    <button
                      type="button"
                      onClick={() => setSupportedModels(supportedModels.filter(x => x !== m))}
                      className="ml-1.5 text-zinc-400 hover:text-zinc-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

          <div className="flex flex-col items-end pt-6 border-t border-zinc-200">
            <button
              type="submit"
              disabled={loading || (!isApproved && !['super_admin', 'admin', 'moderator'].includes(userRole))}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center hover:-translate-y-0.5 sm:min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating ({uploadProgress}%)
                </>
              ) : (
                'Create Prompt'
              )}
            </button>
            {loading && file && (
              <div className="w-full max-w-xs mt-4 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-neon-purple)] mb-4" />
      </div>
    }>
      <CreateContent />
    </Suspense>
  );
}
