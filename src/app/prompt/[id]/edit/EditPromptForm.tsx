'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Wand2, X, Plus, Image as ImageIcon, Loader2, ArrowLeft, ChevronDown, Check, Eye, EyeOff } from 'lucide-react';
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
        is_hidden: isHidden
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="mb-8">
        <Link href={`/prompt/${prompt.id}`} className="inline-flex items-center text-sm font-bold text-zinc-500 hover:text-zinc-950 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel and Back to Prompt
        </Link>
        <h1 className="text-3xl font-bold flex items-center text-zinc-900 tracking-tight">
          <Wand2 className="w-8 h-8 mr-3 text-[var(--color-neon-purple)]" />
          Edit Prompt
        </h1>
        <p className="text-zinc-500 mt-2">
          Update your prompt settings and configurations below.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-650 text-sm font-medium animate-in fade-in zoom-in-95">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
          Changes saved successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Cover Image Upload Area */}
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
                  onClick={removeImage}
                  className="px-6 py-3 bg-white text-red-650 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center shadow-lg cursor-pointer"
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
            {/* Title */}
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

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                rows={3}
                className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/20 transition-all shadow-sm font-semibold text-base sm:text-sm"
                placeholder="Briefly describe what makes this prompt special, or share generation tips..."
              ></textarea>
            </div>

            {/* AI Tool & Category */}
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

            {/* Aspect Ratio */}
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

            {/* Tags */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-50 text-[var(--color-neon-purple)] text-sm font-medium border border-purple-100">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 focus:outline-none hover:text-purple-700 cursor-pointer">
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

            {/* Visibility / Hidden Status Toggle */}
            <div className="p-5 bg-white border border-zinc-200/80 rounded-3xl shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1 pr-4">
                  <label className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    Private Draft / Visibility
                  </label>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    If active, this prompt will be hidden from public exploration feeds and search results, remaining visible only to you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHidden(!isHidden)}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none relative shrink-0 cursor-pointer ${
                    isHidden ? 'bg-[var(--color-neon-purple)]' : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 absolute top-1 left-1 ${
                      isHidden ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Prompt Text */}
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

            {/* Negative Prompt */}
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

        <div className="flex flex-col items-end pt-6 border-t border-zinc-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center hover:-translate-y-0.5 sm:min-w-[200px] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving ({uploadProgress}%)
              </>
            ) : (
              'Save Changes'
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
  );
}
