'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  Wand2, 
  X, 
  Plus, 
  Image as ImageIcon, 
  Loader2, 
  ArrowLeft, 
  ChevronDown, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles,
  Tag as TagIcon,
  Layers,
  Terminal,
  ShieldAlert,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { getPlatformCategoriesAndTools, suggestCategoryOrToolAction } from '@/app/actions/adminActions';
import { updatePromptAction, getPopularTags } from '@/app/actions/prompts';

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
      <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2 flex items-center justify-between">
        <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        {value && <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{value}</span>}
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
          className="block w-full px-4 py-3.5 pr-10 border border-zinc-200/90 rounded-2xl bg-white/90 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-2xs text-sm font-bold"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-400">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-zinc-200/90 rounded-2xl shadow-2xl max-h-60 overflow-hidden py-0 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 bg-zinc-50/90 border-b border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-black uppercase tracking-wider sticky top-0 z-10">
            <span>{label} Options</span>
            <span className="bg-zinc-200/60 px-2 py-0.5 rounded-full text-zinc-600">{filteredOptions.length} of {options.length}</span>
          </div>

          <div className="py-1 overflow-y-auto flex-1 max-h-48 scrollbar-hide">
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
                className={`w-full px-4 py-3 text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  value === opt.name 
                    ? 'text-indigo-600 bg-indigo-50/70 border-l-4 border-indigo-600 pl-3 font-extrabold' 
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 pl-4'
                }`}
              >
                <span>{opt.name}</span>
                {value === opt.name && <Check className="w-4 h-4 text-indigo-600" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-4 py-5 text-center text-xs text-zinc-400 font-medium">
                No matching results
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
              className="w-full px-4 py-3 text-left text-xs font-black text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/60 border-t border-zinc-100 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              Create &quot;{search.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface EditPromptFormProps {
  prompt: any;
}

export default function EditPromptForm({ prompt }: EditPromptFormProps) {
  const router = useRouter();

  // Image states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(prompt.image_url || null);
  const [existingImageUrl] = useState<string | null>(prompt.image_url || null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState(prompt.title || '');
  const [description, setDescription] = useState(prompt.description || '');
  const [promptText, setPromptText] = useState(prompt.prompt_text || '');
  const [negativePrompt, setNegativePrompt] = useState(prompt.negative_prompt || '');
  const [tool, setTool] = useState(prompt.ai_tool || '');
  const [category, setCategory] = useState(prompt.category || '');
  const [tags, setTags] = useState<string[]>(prompt.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState(prompt.aspect_ratio || '1:1');
  const [isHidden, setIsHidden] = useState(prompt.is_hidden || false);

  const [primaryAiPlatform] = useState(prompt.primary_ai_platform || '');
  const [supportedModels] = useState<string[]>(prompt.supported_models || []);
  const [launchUrl] = useState(prompt.launch_url || '');
  const [promptType] = useState(prompt.prompt_type || 'text');

  // Loading/Error states
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Metadata states
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableRatios, setAvailableRatios] = useState<any[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagSuggestionsRef = useRef<HTMLDivElement>(null);

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
    setRemoveExistingImage(false);
  };

  const removeImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!promptText.trim()) {
      setError('Prompt content is required.');
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      let finalImageUrl = existingImageUrl;
      let finalImageWidth = prompt.image_width || null;
      let finalImageHeight = prompt.image_height || null;

      // Case A: Image was removed
      if (removeExistingImage && !file) {
        finalImageUrl = null;
        finalImageWidth = null;
        finalImageHeight = null;
      }

      // Case B: A new image was uploaded
      if (file) {
        setUploadProgress(20);
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('folder', 'prompts');

        setUploadProgress(50);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        const uploadResult = await response.json();

        if (!response.ok) {
          throw new Error(uploadResult.error || 'Image upload failed.');
        }

        finalImageUrl = uploadResult.url;
        finalImageWidth = uploadResult.width;
        finalImageHeight = uploadResult.height;
      }

      setUploadProgress(80);

      let finalTool = tool;
      let finalCategory = category;

      // Auto-create custom tools/categories if they don't exist
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

      // Call secure Owner-Only Server Action
      const res = await updatePromptAction(prompt.id, {
        title,
        description: description.trim() || null,
        prompt_text: promptText,
        negative_prompt: negativePrompt || null,
        ai_tool: finalTool,
        category: finalCategory,
        tags,
        image_url: finalImageUrl,
        image_width: finalImageWidth,
        image_height: finalImageHeight,
        aspect_ratio: aspectRatio,
        is_hidden: isHidden,
        primary_ai_platform: primaryAiPlatform.trim() || null,
        supported_models: supportedModels,
        launch_url: launchUrl.trim() || null,
        prompt_type: promptType
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save changes.');
      }

      setUploadProgress(100);
      setSuccess(true);
      
      // Delay navigation slightly so they can see success state
      setTimeout(() => {
        router.push(`/prompt/${prompt.id}`);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during update.');
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full">
      {/* Navigation Header */}
      <div className="mb-8">
        <Link 
          href={`/prompt/${prompt.id}`} 
          className="inline-flex items-center text-xs font-black uppercase tracking-wider text-zinc-600 hover:text-zinc-900 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-zinc-200/80 shadow-2xs hover:shadow-xs hover:-translate-x-0.5 transition-all mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2 text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
          Back to Prompt Details
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-3 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Owner Edit Workspace
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              Edit Prompt
            </h1>
            <p className="text-zinc-500 text-sm font-medium mt-1">
              Refine your prompt instructions, media attachments, and AI engine parameters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 bg-zinc-100/80 border border-zinc-200/60 px-3 py-1.5 rounded-xl font-mono">
              ID: {prompt.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-8 p-5 bg-rose-50/90 border border-rose-200/80 rounded-3xl text-rose-700 text-sm font-bold flex items-center gap-3.5 shadow-sm animate-in fade-in zoom-in-95">
          <div className="w-9 h-9 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-8 p-5 bg-emerald-50/90 border border-emerald-200/80 rounded-3xl text-emerald-800 text-sm font-bold flex items-center gap-3.5 shadow-sm animate-in fade-in zoom-in-95">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-extrabold">Changes saved successfully!</p>
            <p className="text-xs text-emerald-600 font-medium">Redirecting to updated prompt page...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        
        {/* SECTION 1: COVER IMAGE DROPZONE */}
        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-zinc-900 uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Cover Image
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Upload a cover preview image for your prompt card.
              </p>
            </div>
            {previewUrl && (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Active Cover
              </span>
            )}
          </div>

          <div 
            className={`rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[260px] relative overflow-hidden group
              ${previewUrl 
                ? 'border-transparent bg-zinc-950 p-0 shadow-inner' 
                : isDragging 
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-inner scale-[0.99]' 
                  : 'border-zinc-300/80 bg-zinc-50/50 hover:bg-indigo-50/20 hover:border-indigo-400 cursor-pointer'
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
              <div className="w-full h-full min-h-[280px] max-h-[420px] relative group flex items-center justify-center bg-zinc-900">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain max-h-[420px]" />
                <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-white text-zinc-900 rounded-full font-extrabold text-xs hover:scale-105 transition-all flex items-center shadow-xl cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 mr-2 text-indigo-600" />
                    Change Image
                  </button>
                  <button 
                    type="button" 
                    onClick={removeImage}
                    className="px-5 py-2.5 bg-rose-600 text-white rounded-full font-extrabold text-xs hover:scale-105 transition-all flex items-center shadow-xl cursor-pointer hover:bg-rose-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200/80 group-hover:border-indigo-300 group-hover:scale-110 shadow-xs flex items-center justify-center mb-4 transition-all duration-300">
                  <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h3 className="text-sm font-black text-zinc-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  Drag & drop cover image, or click to browse
                </h3>
                <p className="text-xs text-zinc-400 font-medium max-w-sm mb-3">
                  High quality PNG, JPG, or WebP up to 5MB.
                </p>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  Browse File
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: BASIC METADATA */}
        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-base font-black text-zinc-900 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Prompt Overview
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              General title, summary, and classification tags.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-4 py-3.5 border border-zinc-200/90 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-sm shadow-2xs"
              placeholder="e.g. Cinematic Cyberpunk City Skyline"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2">
              Description <span className="text-zinc-400 font-semibold uppercase text-[10px]">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 border border-zinc-200/90 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm shadow-2xs"
              placeholder="Provide context, style guidance, or recommended generation settings..."
            />
          </div>

          {/* AI Tool & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <Combobox
              label="AI Tool"
              value={tool}
              onChange={setTool}
              options={availableTools}
              placeholder="Search or add AI Tool..."
              required
            />
            <Combobox
              label="Category"
              value={category}
              onChange={setCategory}
              options={availableCategories}
              placeholder="Search or add Category..."
              required
            />
          </div>
        </div>

        {/* SECTION 3: PROMPT CONTENT */}
        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-base font-black text-zinc-900 uppercase tracking-wide flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              Prompt Specification
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              The exact text prompt instructions for the AI generator.
            </p>
          </div>

          {/* Prompt Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                Main Prompt Text <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                {promptText.length} chars
              </span>
            </div>
            <textarea
              required
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={8}
              className="block w-full px-4 py-3.5 border border-zinc-200/90 rounded-2xl bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed shadow-inner"
              placeholder="Enter your exact prompt text..."
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-700">
                Negative Prompt <span className="text-zinc-400 font-semibold uppercase text-[10px]">(Optional)</span>
              </label>
              {negativePrompt && (
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                  {negativePrompt.length} chars
                </span>
              )}
            </div>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              rows={4}
              className="block w-full px-4 py-3 border border-zinc-200/90 rounded-2xl bg-zinc-900/90 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed shadow-inner"
              placeholder="Specify elements to exclude (e.g. blurry, distorted hands, low quality)..."
            />
          </div>
        </div>

        {/* SECTION 4: ASPECT RATIO, TAGS & VISIBILITY */}
        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xs space-y-8">
          
          {/* Aspect Ratio */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Aspect Ratio <span className="text-rose-500">*</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Select target canvas dimensions</p>
              </div>
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-mono">
                {aspectRatio}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availableRatios.map((r: any) => {
                const isSelected = aspectRatio === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between items-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:scale-[1.02]
                      ${isSelected 
                        ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs' 
                        : 'bg-white border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
                      }
                    `}
                  >
                    <div className="h-8 flex items-center justify-center">
                      <div 
                        className={`rounded border transition-all duration-200
                          ${isSelected 
                            ? 'border-indigo-600 bg-indigo-600/20' 
                            : 'border-zinc-300 bg-zinc-100'
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
                      <span className={`text-[11px] font-black tracking-tight ${isSelected ? 'text-indigo-600' : 'text-zinc-900'}`}>
                        {r.id}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-bold mt-0.5">
                        {r.label.split('(')[1]?.replace(')', '') || ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="border-t border-zinc-100 pt-6">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-indigo-600" />
              Tags
            </label>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100/80 shadow-2xs">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-indigo-400 hover:text-indigo-700 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Plus className="h-4 w-4 text-zinc-400" />
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
                className="block w-full pl-11 pr-4 py-3 border border-zinc-200/90 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-xs shadow-2xs"
                placeholder="Type tag and press Enter..."
              />
              {showTagSuggestions && (
                <div ref={tagSuggestionsRef} className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-zinc-200/90 rounded-2xl shadow-xl max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-2 duration-150">
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
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span>#{tag}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Popular Tag</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visibility Switch */}
          <div className="border-t border-zinc-100 pt-6">
            <div className="p-5 bg-zinc-50/80 border border-zinc-200/70 rounded-3xl flex items-center justify-between">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  {isHidden ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                    {isHidden ? 'Private Draft (Hidden)' : 'Publicly Visible'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  {isHidden 
                    ? 'Hidden from public search and explore feeds. Only accessible via direct URL.' 
                    : 'Visible to all community members across explore and search feeds.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHidden(!isHidden)}
                className={`w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none relative shrink-0 cursor-pointer p-1 ${
                  isHidden ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                    isHidden ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>



        {/* FLOATING ACTION BAR */}
        <div className="sticky bottom-6 z-40 bg-white/90 backdrop-blur-2xl border border-zinc-200/90 rounded-full px-6 py-4 shadow-xl flex items-center justify-between gap-4">
          <Link
            href={`/prompt/${prompt.id}`}
            className="text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors px-4 py-2"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center hover:-translate-y-0.5 cursor-pointer min-w-[170px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving ({uploadProgress}%)
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
